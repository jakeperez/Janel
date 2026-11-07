# GiftVault: Vercel + Supabase

A static site (HTML, CSS, JS) that talks to your Supabase project. Vercel hosts it; Supabase handles accounts, balances and orders.

```
public/            the website (index.html, style.css, script.js, images/)
build.js           writes public/config.js from your Vercel environment variables
vercel.json        tells Vercel to run the build and serve public/
supabase/schema.sql   database tables, security rules and functions
```

## 1. Set up the database (once)
1. Supabase Dashboard > **SQL Editor** > New query.
2. Paste all of `supabase/schema.sql` and click **Run**.

## 2. Get your keys
Supabase > **Project Settings > API**:
- **Project URL**: `https://xrfehvxqchskxcjytkvv.supabase.co`
- **anon / publishable key**: safe to use in a website.
- Never use the **service_role / secret** key. `build.js` refuses it.

## 3. Put the project on GitHub
```
git init
git add .
git commit -m "GiftVault"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/giftvault.git
git push -u origin main
```
(You can also run `npx vercel` in this folder instead of using GitHub.)

## 4. Deploy on Vercel
1. vercel.com > **Add New > Project** > import the repo.
2. Framework Preset: **Other**. The build command and output folder are read from `vercel.json`.
3. Open **Environment Variables** and add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_ANON_KEY` = your anon / publishable key
4. Click **Deploy**. If you change the variables later, press **Redeploy**; they are baked in at build time.

## 5. Tell Supabase about your Vercel address
Supabase > **Authentication > URL Configuration**:
- **Site URL**: `https://YOUR-APP.vercel.app`
- **Redirect URLs**: add `https://YOUR-APP.vercel.app/**` and, for testing, `http://localhost:3000/**`

For Google sign-in: Authentication > Providers > Google, paste your Google client ID and secret. In Google Cloud, the authorized redirect URI is `https://xrfehvxqchskxcjytkvv.supabase.co/auth/v1/callback`.
While testing, you may turn off **Confirm email** under Authentication > Providers > Email.

## 6. Make your admin account
1. Register on your live site.
2. In the SQL Editor run (with your email):
   `update public.profiles set role = 'admin' where email = 'YOUR-EMAIL@gmail.com';`
3. Log out and back in. An **Admin** button appears.

## Run it on your computer
```
cp .env.example .env     # then edit the two values
export $(cat .env | xargs) && npm run dev
```
Open http://localhost:3000

## Adding gift card pictures
Put images in `public/images/` and edit the "GIFT CARD PICTURES" section at the bottom of `public/style.css`.

## Before real money
- Delete the `deposit_demo` function and credit balances from your payment provider's webhook.
- Move prices into a database table so the server, not the browser, decides what things cost.
- Gift card codes in this project are random demo codes. Real codes come from a supplier.
