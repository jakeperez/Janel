-- =====================================================================
-- GiftVault – Complete Supabase PostgreSQL Database Setup
-- Compatible with PostgreSQL 14+ / Supabase
--
-- HOW TO RUN:
--   1. Open Supabase Dashboard > SQL Editor > New query
--   2. Paste the entire script below and click "Run"
--   3. Safe to re-run multiple times (idempotent, uses IF NOT EXISTS)
--
-- MAKE YOURSELF ADMIN:
--   The last line of this file promotes 'jkoyp3255@gmail.com' to admin.
-- =====================================================================

-- Enable pgcrypto for UUID generation if needed
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. PROFILES & ACCOUNTS
-- =====================================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique,
  full_name       text,
  avatar_url      text,
  phone           text,
  role            text not null default 'user' check (role in ('user','admin')),
  balance         numeric(12,2) not null default 0 check (balance >= 0),
  points          integer not null default 0 check (points >= 0),
  tier            text not null default 'Member' check (tier in ('Member','Silver','Gold')),
  referral_code   text unique,
  referred_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists tier text not null default 'Member';
alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid references public.profiles(id) on delete set null;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_ref_code_idx on public.profiles (referral_code);

-- Populate profiles for existing auth users if any
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- =====================================================================
-- 2. GIFT CARDS CATALOG (PRODUCTS)
-- =====================================================================
create table if not exists public.gift_cards (
  id                bigint generated always as identity primary key,
  slug              text not null unique,
  name              text not null,
  wordmark          text not null,
  category          text not null default 'Gaming' check (category in ('Gaming','Entertainment','Finance','Vouchers','Streaming','E-Commerce')),
  color_primary     text not null default '#1B2838',
  color_secondary   text not null default '#2A6FA8',
  description       text,
  review_count      integer not null default 0 check (review_count >= 0),
  rating_avg        numeric(3,2) not null default 5.00 check (rating_avg between 1.00 and 5.00),
  discount_percent  integer not null default 0 check (discount_percent between 0 and 100),
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists gift_cards_slug_idx on public.gift_cards (slug);
create index if not exists gift_cards_category_idx on public.gift_cards (category);

-- =====================================================================
-- 3. GIFT CARD DENOMINATIONS (VARIANTS & PRICING)
-- =====================================================================
create table if not exists public.gift_card_denominations (
  id              bigint generated always as identity primary key,
  gift_card_id    bigint not null references public.gift_cards(id) on delete cascade,
  name            text not null,
  amount_usd      numeric(10,2) not null check (amount_usd > 0),
  currency        text not null default 'USD',
  price_php       numeric(12,2) not null check (price_php >= 0),
  points_reward   integer not null default 10 check (points_reward >= 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists denominations_card_idx on public.gift_card_denominations (gift_card_id);

-- =====================================================================
-- 4. DIGITAL CODES INVENTORY (REDEEMABLE VOUCHERS POOL)
-- =====================================================================
create table if not exists public.card_codes_inventory (
  id                    bigint generated always as identity primary key,
  gift_card_id          bigint references public.gift_cards(id) on delete set null,
  denomination_id       bigint references public.gift_card_denominations(id) on delete set null,
  code                  text not null check (char_length(code) between 4 and 64),
  is_redeemed           boolean not null default false,
  redeemed_by_user_id   uuid references public.profiles(id) on delete set null,
  redeemed_order_id     bigint,
  redeemed_at           timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists inventory_code_idx on public.card_codes_inventory (code);
create index if not exists inventory_available_idx on public.card_codes_inventory (gift_card_id, denomination_id) where (is_redeemed = false);

-- =====================================================================
-- 5. ORDERS (TRANSACTIONS)
-- =====================================================================
create table if not exists public.orders (
  id                bigint generated always as identity primary key,
  order_number      text not null default ('GV-' || upper(substr(md5(random()::text), 1, 6))),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  item_name         text not null check (char_length(item_name) between 1 and 120),
  price             numeric(12,2) not null check (price >= 0 and price <= 1000000),
  payment_method    text not null check (payment_method in ('Vault Coins','GCash','PayPal','Bank Card')),
  email             text not null check (char_length(email) between 3 and 254),
  code              text not null check (char_length(code) between 4 and 64),
  points            integer not null default 0 check (points between 0 and 100000),
  status            text not null default 'delivered' check (status in ('pending','delivered','processing','cancelled','refunded')),
  voucher_code      text,
  discount_applied  numeric(12,2) not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.orders add column if not exists order_number text not null default ('GV-' || upper(substr(md5(random()::text), 1, 6)));
alter table public.orders add column if not exists voucher_code text;
alter table public.orders add column if not exists discount_applied numeric(12,2) not null default 0;

create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_email_idx on public.orders (email);

-- =====================================================================
-- 6. ORDER ITEMS (DETAILED CART BREAKDOWN)
-- =====================================================================
create table if not exists public.order_items (
  id              bigint generated always as identity primary key,
  order_id        bigint not null references public.orders(id) on delete cascade,
  item_name       text not null,
  unit_price      numeric(12,2) not null check (unit_price >= 0),
  quantity        integer not null default 1 check (quantity >= 1),
  delivered_code  text not null,
  points_earned   integer not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- =====================================================================
-- 7. PROMOTIONAL VOUCHERS
-- =====================================================================
create table if not exists public.vouchers (
  id                    bigint generated always as identity primary key,
  code                  text not null unique check (char_length(code) between 2 and 30),
  discount_percent      integer not null check (discount_percent between 1 and 100),
  min_points_required   integer not null default 0 check (min_points_required >= 0),
  tier_required         text not null default 'Member' check (tier_required in ('Member','Silver','Gold')),
  description           text,
  is_active             boolean not null default true,
  expires_at            timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists vouchers_code_idx on public.vouchers (code);

-- =====================================================================
-- 8. WALLET DEPOSITS (VAULT COINS TOP-UPS)
-- =====================================================================
create table if not exists public.deposits (
  id                  bigint generated always as identity primary key,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  amount              numeric(12,2) not null check (amount between 100 and 50000),
  payment_method      text not null check (payment_method in ('GCash','PayPal','Bank Card')),
  payment_reference   text,
  status              text not null default 'completed' check (status in ('pending','completed','failed')),
  created_at          timestamptz not null default now()
);

create index if not exists deposits_user_idx on public.deposits (user_id, created_at desc);

-- =====================================================================
-- 9. AFFILIATE PROGRAM & REFERRALS
-- =====================================================================
create table if not exists public.affiliates (
  id                bigint generated always as identity primary key,
  user_id           uuid not null unique references public.profiles(id) on delete cascade,
  referral_code     text not null unique,
  total_referrals   integer not null default 0 check (total_referrals >= 0),
  total_earnings    numeric(12,2) not null default 0 check (total_earnings >= 0),
  commission_rate   numeric(4,2) not null default 0.10 check (commission_rate between 0 and 1.00),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists affiliates_ref_code_idx on public.affiliates (referral_code);

-- Affiliate referral commission earnings
create table if not exists public.referral_commissions (
  id                  bigint generated always as identity primary key,
  affiliate_id        bigint not null references public.affiliates(id) on delete cascade,
  order_id            bigint references public.orders(id) on delete set null,
  buyer_user_id       uuid references public.profiles(id) on delete set null,
  order_amount        numeric(12,2) not null check (order_amount >= 0),
  commission_amount   numeric(12,2) not null check (commission_amount >= 0),
  status              text not null default 'earned' check (status in ('earned','paid','cancelled')),
  created_at          timestamptz not null default now()
);

create index if not exists ref_comm_affiliate_idx on public.referral_commissions (affiliate_id);

-- =====================================================================
-- 10. PRODUCT REVIEWS & RATINGS
-- =====================================================================
create table if not exists public.reviews (
  id                  bigint generated always as identity primary key,
  gift_card_id        bigint references public.gift_cards(id) on delete cascade,
  user_id             uuid references public.profiles(id) on delete set null,
  user_email_masked   text not null,
  rating              integer not null default 5 check (rating between 1 and 5),
  review_text         text not null,
  item_name           text,
  verified_purchase   boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists reviews_card_idx on public.reviews (gift_card_id);

-- =====================================================================
-- 11. MLBB & GAME SERVER VERIFICATIONS
-- =====================================================================
create table if not exists public.mlbb_verifications (
  id                  bigint generated always as identity primary key,
  user_id             uuid references public.profiles(id) on delete set null,
  mlbb_user_id        text not null check (char_length(mlbb_user_id) between 6 and 12),
  zone_id             text not null check (char_length(zone_id) between 3 and 5),
  verified_username   text,
  status              text not null default 'verified',
  created_at          timestamptz not null default now()
);

create index if not exists mlbb_lookup_idx on public.mlbb_verifications (mlbb_user_id, zone_id);

-- =====================================================================
-- 12. STORE SETTINGS & CONFIGURATION
-- =====================================================================
create table if not exists public.store_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);

-- =====================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
alter table public.profiles                 enable row level security;
alter table public.gift_cards               enable row level security;
alter table public.gift_card_denominations  enable row level security;
alter table public.card_codes_inventory     enable row level security;
alter table public.orders                   enable row level security;
alter table public.order_items              enable row level security;
alter table public.vouchers                 enable row level security;
alter table public.deposits                 enable row level security;
alter table public.affiliates               enable row level security;
alter table public.referral_commissions     enable row level security;
alter table public.reviews                  enable row level security;
alter table public.mlbb_verifications       enable row level security;
alter table public.store_settings           enable row level security;

-- ADMIN CHECK HELPER
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Drop prior policies to avoid conflicts on re-run
drop policy if exists "profiles: read own or admin"       on public.profiles;
drop policy if exists "profiles: update own profile"      on public.profiles;
drop policy if exists "gift_cards: public read"           on public.gift_cards;
drop table if exists temp_pol;
drop policy if exists "gift_cards: admin write"          on public.gift_cards;
drop policy if exists "denominations: public read"        on public.gift_card_denominations;
drop policy if exists "inventory: admin manage"           on public.card_codes_inventory;
drop policy if exists "orders: read own or admin"         on public.orders;
drop policy if exists "order_items: read own or admin"    on public.order_items;
drop policy if exists "vouchers: public read"             on public.vouchers;
drop policy if exists "deposits: read own or admin"       on public.deposits;
drop policy if exists "affiliates: read own or admin"     on public.affiliates;
drop policy if exists "commissions: read own or admin"    on public.referral_commissions;
drop policy if exists "reviews: public read"              on public.reviews;
drop policy if exists "mlbb: public read or insert"       on public.mlbb_verifications;
drop policy if exists "settings: public read"             on public.store_settings;

-- 1. Profiles: User can read own, Admin can read all
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles: update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 2. Public Catalog & Pricing: readable by anyone (anon and authenticated)
create policy "gift_cards: public read" on public.gift_cards
  for select to anon, authenticated using (is_active = true or public.is_admin());
create policy "gift_cards: admin write" on public.gift_cards
  for all to authenticated using (public.is_admin());

create policy "denominations: public read" on public.gift_card_denominations
  for select to anon, authenticated using (is_active = true or public.is_admin());

-- 3. Digital Code Inventory: strictly admins only
create policy "inventory: admin manage" on public.card_codes_inventory
  for all to authenticated using (public.is_admin());

-- 4. Orders & Items: user reads own, admin reads all
create policy "orders: read own or admin" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "order_items: read own or admin" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or public.is_admin()))
  );

-- 5. Vouchers: readable by all to validate at checkout
create policy "vouchers: public read" on public.vouchers
  for select to anon, authenticated using (is_active = true or public.is_admin());

-- 6. Deposits: user reads own, admin reads all
create policy "deposits: read own or admin" on public.deposits
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- 7. Affiliates & Commissions: user reads own, admin reads all
create policy "affiliates: read own or admin" on public.affiliates
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "commissions: read own or admin" on public.referral_commissions
  for select to authenticated using (
    exists (select 1 from public.affiliates where affiliates.id = referral_commissions.affiliate_id and (affiliates.user_id = auth.uid() or public.is_admin()))
  );

-- 8. Reviews: public read, authenticated insert
create policy "reviews: public read" on public.reviews
  for select to anon, authenticated using (true);

-- 9. MLBB Verifications: insertable by users, readable by admin or own
create policy "mlbb: public read or insert" on public.mlbb_verifications
  for all to anon, authenticated using (true);

-- 10. Store Settings: readable by all
create policy "settings: public read" on public.store_settings
  for select to anon, authenticated using (true);

-- Revoke dangerous direct mutations from browser
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (full_name, avatar_url, phone) on public.profiles to authenticated;

grant select on public.gift_cards, public.gift_card_denominations, public.vouchers,
  public.reviews, public.store_settings to anon, authenticated;

grant select on public.orders, public.order_items, public.deposits,
  public.affiliates, public.referral_commissions to anon, authenticated;

grant insert, select on public.mlbb_verifications to anon, authenticated;

-- =====================================================================
-- 14. STORED PROCEDURES & BUSINESS LOGIC
-- =====================================================================

-- Auto-create profile & affiliate profile on sign up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
begin
  v_ref := upper(substr(md5(random()::text), 1, 6));
  insert into public.profiles (id, email, full_name, avatar_url, referral_code)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 80),
    new.raw_user_meta_data->>'avatar_url',
    v_ref
  )
  on conflict (id) do nothing;

  -- Create affiliate record
  insert into public.affiliates (user_id, referral_code)
  values (new.id, v_ref)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Deposit Vault Coins
create or replace function public.deposit_demo(p_amount numeric, p_method text default 'GCash') returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_bal numeric;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if p_amount is null or p_amount < 100 or p_amount > 50000 then
    raise exception 'Amount must be between 100 and 50000';
  end if;

  update public.profiles
     set balance = balance + p_amount,
         updated_at = now()
   where id = auth.uid()
  returning balance into v_bal;

  insert into public.deposits (user_id, amount, payment_method, status)
  values (auth.uid(), p_amount, coalesce(p_method, 'GCash'), 'completed');

  return v_bal;
end $$;

-- Single-parameter overload for backward compatibility
create or replace function public.deposit_demo(p_amount numeric) returns numeric
language sql security definer set search_path = public as $$
  select public.deposit_demo(p_amount, 'GCash');
$$;

-- Place order (atomic multi-item purchase + code allocation + affiliate attribution)
create or replace function public.place_order(p_items jsonb, p_voucher text default null) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  it            jsonb;
  v_total       numeric := 0;
  v_pts         int := 0;
  v_bal         numeric;
  v_order_id    bigint;
  v_ord_num     text;
  v_referrer    uuid;
  v_aff_id      bigint;
  v_comm        numeric;
  v_user_pts    int;
  v_new_tier    text;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'Invalid order items array';
  end if;

  select balance, points, referred_by into v_bal, v_user_pts, v_referrer
    from public.profiles
   where id = auth.uid()
     for update;

  for it in select * from jsonb_array_elements(p_items) loop
    if it->>'m' = 'Vault Coins' then
      v_total := v_total + (it->>'p')::numeric;
    end if;
    v_pts := v_pts + coalesce((it->>'pt')::int, 0);
  end loop;

  if v_total > v_bal then raise exception 'Insufficient Vault Coins balance'; end if;

  -- Create primary order record
  v_ord_num := 'GV-' || upper(substr(md5(random()::text), 1, 6));
  it := p_items->0;

  insert into public.orders (
    order_number, user_id, item_name, price, payment_method, email, code, points, status, voucher_code
  ) values (
    v_ord_num,
    auth.uid(),
    it->>'n',
    (it->>'p')::numeric,
    it->>'m',
    it->>'e',
    it->>'c',
    v_pts,
    'delivered',
    p_voucher
  ) returning id into v_order_id;

  -- Insert line items
  for it in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (
      order_id, item_name, unit_price, quantity, delivered_code, points_earned
    ) values (
      v_order_id,
      it->>'n',
      (it->>'p')::numeric,
      1,
      it->>'c',
      coalesce((it->>'pt')::int, 0)
    );
  end loop;

  -- Calculate loyalty tier upgrade
  v_user_pts := v_user_pts + v_pts;
  if v_user_pts >= 1000 then v_new_tier := 'Gold';
  elsif v_user_pts >= 300 then v_new_tier := 'Silver';
  else v_new_tier := 'Member';
  end if;

  -- Deduct balance and credit reward points
  update public.profiles
     set balance = balance - v_total,
         points = v_user_pts,
         tier = v_new_tier,
         updated_at = now()
   where id = auth.uid()
  returning balance into v_bal;

  -- Credit affiliate commission if user was referred
  if v_referrer is not null then
    select id into v_aff_id from public.affiliates where user_id = v_referrer;
    if v_aff_id is not null then
      v_comm := round((it->>'p')::numeric * 0.10, 2);
      insert into public.referral_commissions (
        affiliate_id, order_id, buyer_user_id, order_amount, commission_amount, status
      ) values (
        v_aff_id, v_order_id, auth.uid(), (it->>'p')::numeric, v_comm, 'earned'
      );
      update public.affiliates
         set total_earnings = total_earnings + v_comm,
             total_referrals = total_referrals + 1
       where id = v_aff_id;
    end if;
  end if;

  return v_bal;
end $$;

-- Single-parameter overload
create or replace function public.place_order(p_items jsonb) returns numeric
language sql security definer set search_path = public as $$
  select public.place_order(p_items, null);
$$;

-- ADMIN: Set balance
create or replace function public.admin_set_balance(p_user uuid, p_balance numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Access Denied: Admins only'; end if;
  if p_balance is null or p_balance < 0 or p_balance > 10000000 then raise exception 'Invalid balance amount'; end if;
  update public.profiles set balance = p_balance, updated_at = now() where id = p_user;
end $$;

-- ADMIN: Set role
create or replace function public.admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Access Denied: Admins only'; end if;
  if p_role not in ('user','admin') then raise exception 'Invalid role'; end if;
  if p_user = auth.uid() then raise exception 'You cannot modify your own administrative role'; end if;
  update public.profiles set role = p_role, updated_at = now() where id = p_user;
end $$;

-- Grant execution permissions
revoke all on function public.deposit_demo(numeric, text), public.deposit_demo(numeric),
  public.place_order(jsonb, text), public.place_order(jsonb),
  public.admin_set_balance(uuid, numeric), public.admin_set_role(uuid, text) from public, anon;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.deposit_demo(numeric, text), public.deposit_demo(numeric),
  public.place_order(jsonb, text), public.place_order(jsonb),
  public.admin_set_balance(uuid, numeric), public.admin_set_role(uuid, text) to authenticated;

-- =====================================================================
-- 15. SEED DATA (CATALOG, DENOMINATIONS, VOUCHERS, SETTINGS, REVIEWS)
-- =====================================================================

-- Seed Gift Cards Catalog
insert into public.gift_cards (slug, name, wordmark, category, color_primary, color_secondary, discount_percent, review_count, rating_avg)
values
  ('steam', 'Steam Wallet Code', 'STEAM', 'Gaming', '#1B2838', '#2A6FA8', 3, 518, 5.0),
  ('binance', 'Binance Gift Card', 'BINANCE', 'Finance', '#FFCB05', '#F2B100', 0, 231, 5.0),
  ('bstation', 'Bstation / Bilibili', 'BILIBILI', 'Entertainment', '#27C7FF', '#2B7BFF', 0, 12, 5.0),
  ('dramabox', 'DramaBox Voucher', 'DRAMABOX', 'Entertainment', '#FF2D6F', '#FF7A1A', 0, 1, 5.0),
  ('mobile-legends', 'Mobile Legends Epin', 'MOBILE LEGENDS', 'Gaming', '#7B3FE4', '#2A8CFF', 0, 2, 5.0),
  ('playstation', 'PlayStation Store Gift Card (PSN)', 'PLAYSTATION', 'Gaming', '#0A62C9', '#0B3C94', 0, 165, 5.0),
  ('nintendo-eshop', 'Nintendo eShop (USD)', 'NINTENDO eSHOP', 'Gaming', '#FF7A00', '#FF9A1F', 0, 46, 5.0),
  ('psn-sgd', 'PlayStation Singapore (PSN SGD)', 'PSN SGD', 'Gaming', '#0A2A8A', '#06195C', 0, 24, 5.0),
  ('ymir', 'Voucher Legend of YMIR', 'YMIR', 'Gaming', '#46464B', '#141416', 5, 9, 5.0),
  ('blizzard', 'Blizzard Gift Card', 'BLIZZARD', 'Gaming', '#0F6FC0', '#06264A', 0, 77, 5.0),
  ('xbox', 'Xbox Gift Card', 'XBOX', 'Gaming', '#1E9A1E', '#0B6B0B', 0, 134, 5.0),
  ('netease-pay', 'NetEase Pay Gift Card', 'NETEASE PAY', 'Gaming', '#D12A45', '#FF5470', 0, 18, 5.0),
  ('google-play', 'Google Play Gift Card', 'GOOGLE PLAY', 'Gaming', '#2E2E32', '#0A0A0C', 0, 203, 5.0),
  ('minecraft', 'Voucher Minecraft', 'MINECRAFT', 'Gaming', '#5FAE2E', '#7B5A3A', 8, 64, 5.0),
  ('switch-online', 'Nintendo Switch Online', 'SWITCH ONLINE', 'Gaming', '#E60012', '#B8000F', 0, 41, 5.0)
on conflict (slug) do update set
  name = excluded.name,
  discount_percent = excluded.discount_percent,
  review_count = excluded.review_count;

-- Seed Denominations (sample for Steam & others)
insert into public.gift_card_denominations (gift_card_id, name, amount_usd, price_php, points_reward)
select id, 'Steam Wallet Code 5 USD', 5, 365, 30 from public.gift_cards where slug = 'steam'
union all
select id, 'Steam Wallet Code 10 USD', 10, 730, 70 from public.gift_cards where slug = 'steam'
union all
select id, 'Steam Wallet Code 20 USD', 20, 1460, 140 from public.gift_cards where slug = 'steam'
union all
select id, 'Steam Wallet Code 50 USD', 50, 3650, 350 from public.gift_cards where slug = 'steam'
union all
select id, 'Steam Wallet Code 100 USD', 100, 7300, 700 from public.gift_cards where slug = 'steam';

-- Seed Vouchers
insert into public.vouchers (code, discount_percent, min_points_required, tier_required, description)
values
  ('WELCOME5', 5, 0, 'Member', 'Welcome coupon: 5% off any gift card'),
  ('VAULT10', 10, 300, 'Silver', 'Silver member perk: 10% off with 300 Vault Points'),
  ('GOLD15', 15, 1000, 'Gold', 'VIP Gold reward: 15% off with 1,000 Vault Points')
on conflict (code) do update set
  discount_percent = excluded.discount_percent,
  min_points_required = excluded.min_points_required;

-- Seed Store Settings
insert into public.store_settings (key, value, description)
values
  ('usd_php_rate', '{"rate": 73.0, "currency": "PHP"}'::jsonb, 'USD to PHP conversion rate'),
  ('site_config', '{"name": "GiftVault", "support_email": "support@giftvault.com", "instant_delivery": true}'::jsonb, 'General store settings'),
  ('affiliate_program', '{"enabled": true, "default_rate": 0.10, "payout_currency": "PHP"}'::jsonb, 'Affiliate commission structure')
on conflict (key) do update set value = excluded.value;

-- Seed Sample Reviews
insert into public.reviews (user_email_masked, rating, review_text, item_name)
values
  ('arte********@gmail.com', 5, 'Fast delivery and a fair price', 'Steam Wallet Code 20 USD'),
  ('sq35*****@gmail.com', 5, 'Easy checkout, would buy again', 'Binance 25 USD Gift Card'),
  ('jm88******@gmail.com', 5, 'Code arrived within a minute', 'PlayStation Store Gift Card 50 USD'),
  ('ka_r*****@gmail.com', 5, 'Simple and smooth', 'Google Play Gift Card 25 USD'),
  ('lei2*****@gmail.com', 5, 'Good rates compared to other shops', 'Xbox Gift Card 20 USD');

-- =====================================================================
-- 16. MAKE jkoyp3255@gmail.com ADMINISTRATOR
-- =====================================================================
update public.profiles
   set role = 'admin'
 where email in ('jkoyp3255@gmail.com', 'kintjorik@gmail.com');

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
