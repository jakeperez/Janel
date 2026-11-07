-- =====================================================================
-- GiftVault – Supabase database setup
-- NOTE: Supabase runs PostgreSQL, not MySQL. This is PostgreSQL SQL.
--
-- HOW TO RUN: Supabase Dashboard > SQL Editor > New query > paste all > Run.
-- Safe to re-run. It also upgrades the older "profiles" table from before.
--
-- HOW TO CREATE YOUR ADMIN ACCOUNT:
--   1. Register on the site (or Dashboard > Authentication > Users > Add user).
--   2. Run the UPDATE at the very bottom of this file with your email.
--   3. Log out and log in again. An "Admin" button appears in the top bar.
-- =====================================================================

-- ---------- 1. PROFILES (one row per account) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user',
  balance     numeric(12,2) not null default 5000 check (balance >= 0),
  points      integer not null default 0 check (points >= 0),
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists points integer not null default 0;
alter table public.profiles alter column balance set default 5000;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('user','admin'));
  end if;
end $$;

-- Create profiles for accounts that already exist
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ---------- 2. ORDERS (every purchase) ----------
create table if not exists public.orders (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  item_name       text not null check (char_length(item_name) between 1 and 120),
  price           numeric(12,2) not null check (price >= 0 and price <= 1000000),
  payment_method  text not null check (payment_method in ('Vault Coins','GCash','PayPal','Bank Card')),
  email           text not null check (char_length(email) between 3 and 254),
  code            text not null check (char_length(code) between 4 and 40),
  points          integer not null default 0 check (points between 0 and 100000),
  status          text not null default 'delivered',
  created_at      timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

-- ---------- 3. ADMIN CHECK ----------
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- 4. AUTO-CREATE A PROFILE ON SIGN UP ----------
-- The role is always 'user' here. It is never read from user-supplied data.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email,
          left(coalesce(new.raw_user_meta_data->>'full_name', ''), 80),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 5. SECURITY (Row Level Security + privileges) ----------
alter table public.profiles enable row level security;
alter table public.orders   enable row level security;

drop policy if exists "read own profile"            on public.profiles;
drop policy if exists "update own profile"          on public.profiles;
drop policy if exists "profiles: read own or admin" on public.profiles;
drop policy if exists "profiles: update own name"   on public.profiles;
drop policy if exists "orders: read own or admin"   on public.orders;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: update own name" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "orders: read own or admin" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Logged-in users can READ, and can only change their own name/avatar.
-- Nobody can change role, balance or points directly from the browser.
revoke all on public.profiles from anon, authenticated;
revoke all on public.orders   from anon, authenticated;
grant select on public.profiles, public.orders to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- ---------- 6. FUNCTIONS THE WEBSITE CALLS ----------

-- DEMO ONLY: adds fake money for the demo deposit screen.
-- In a real store, remove this and credit balances from your payment
-- provider's webhook (PayMongo, Xendit, PayPal) using the service role.
create or replace function public.deposit_demo(p_amount numeric) returns numeric
language plpgsql security definer set search_path = public as $$
declare v_bal numeric;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if p_amount is null or p_amount < 100 or p_amount > 50000 then
    raise exception 'Amount must be between 100 and 50000';
  end if;
  update public.profiles set balance = balance + p_amount
   where id = auth.uid() returning balance into v_bal;
  return v_bal;
end $$;

-- Saves an order (one or many items) in a single all-or-nothing step and
-- takes the money from the balance when the method is Vault Coins.
-- p_items example: [{"n":"Xbox Gift Card 10 USD","p":730,"m":"Vault Coins","e":"a@b.com","c":"ABCD-EFGH-JKLM","pt":70}]
-- LIMIT: prices come from the website. Before real money, move prices into a
-- products table and look them up here instead.
create or replace function public.place_order(p_items jsonb) returns numeric
language plpgsql security definer set search_path = public as $$
declare it jsonb; v_total numeric := 0; v_pts int := 0; v_bal numeric; v_n int;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Invalid order'; end if;
  v_n := jsonb_array_length(p_items);
  if v_n < 1 or v_n > 50 then raise exception 'An order must have 1 to 50 items'; end if;

  select balance into v_bal from public.profiles where id = auth.uid() for update;

  for it in select * from jsonb_array_elements(p_items) loop
    insert into public.orders (user_id, item_name, price, payment_method, email, code, points)
    values (auth.uid(), it->>'n', (it->>'p')::numeric, it->>'m', it->>'e', it->>'c',
            coalesce((it->>'pt')::int, 0));
    v_pts := v_pts + coalesce((it->>'pt')::int, 0);
    if it->>'m' = 'Vault Coins' then v_total := v_total + (it->>'p')::numeric; end if;
  end loop;

  if v_total > v_bal then raise exception 'Not enough Vault Coins'; end if;

  update public.profiles set balance = balance - v_total, points = points + v_pts
   where id = auth.uid() returning balance into v_bal;
  return v_bal;
end $$;

-- ADMIN: set a user's balance
create or replace function public.admin_set_balance(p_user uuid, p_balance numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_balance is null or p_balance < 0 or p_balance > 10000000 then raise exception 'Invalid balance'; end if;
  update public.profiles set balance = p_balance where id = p_user;
end $$;

-- ADMIN: promote or demote a user (you cannot change your own role)
create or replace function public.admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_role not in ('user','admin') then raise exception 'Invalid role'; end if;
  if p_user = auth.uid() then raise exception 'You cannot change your own role'; end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

revoke all on function public.is_admin(), public.deposit_demo(numeric), public.place_order(jsonb),
  public.admin_set_balance(uuid, numeric), public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.is_admin(), public.deposit_demo(numeric), public.place_order(jsonb),
  public.admin_set_balance(uuid, numeric), public.admin_set_role(uuid, text) to authenticated;

-- ---------- 7. MAKE YOUR FIRST ADMIN ----------
-- Register on the site first, then put YOUR email below and run just this line:
-- update public.profiles set role = 'admin' where email = 'jkoyp3255@gmail.com';
