# Deployment

## How it fits together

| | Test | Production |
|---|---|---|
| Store | https://test.polillita-shop.com.mx | https://polillita-shop.com.mx |
| API | https://api-test.polillita-shop.com.mx | https://api.polillita-shop.com.mx |
| Render services | `polillita-web-test`, `polillita-api-test` (free) | `polillita-web`, `polillita-api` (Starter, $7/mo) |
| Supabase | `fbjeffoqtvfaikjcrbiv` (the original project) | new project `polillita-prod` |
| Stripe | test mode | live mode |
| Git branch | `develop` | `main` |

- **Code:** merge into `develop` and test deploys automatically once the GitHub tests pass. Merge `develop` into `main` and production deploys the same way. All four services are defined in `render.yaml`.
- **Database changes:** a new file in `supabase/migrations/` is applied by the "Database migrations" workflow: to test when it reaches `develop`, to production when it reaches `main` (after you approve it in GitHub).
- **HTTPS:** Render issues and renews the certificates for every domain automatically. There's nothing to buy.

---

## One-time setup

Do these in order. ⏱ marks steps that wait on something outside your control.

### 1. Production Supabase project
1. Supabase → **New project**: name `polillita-prod`, region **East US (Ohio)**, a strong database password (save it in your password manager).
2. Project Settings → Database → **Connection string → Session pooler**. Copy it and put the password in: this is `PROD_DB_URL`.
3. Do the same on the **test** project: `TEST_DB_URL`.
4. Apply the schema to production (from the repo root):
   ```
   npx supabase db push --db-url "<PROD_DB_URL>"
   ```
   Then run `supabase/seed.sql` in production's SQL Editor (categories).
5. Tell the test project the baseline is already there, so later migrations are tracked:
   ```
   npx supabase migration repair --status applied 20261004000000 --db-url "<TEST_DB_URL>"
   ```
6. **Check:** run `supabase/export-schema.sql` in production's SQL Editor and compare it with `supabase/schema-export.csv`.

### 2. Supabase Auth (each project)
Authentication → URL Configuration, and Sign In / Providers:

| Setting | Test | Production |
|---|---|---|
| Site URL | `https://test.polillita-shop.com.mx` | `https://polillita-shop.com.mx` |
| Redirect URLs | `https://test.polillita-shop.com.mx/**` (keep `http://localhost:5173/**`) | `https://polillita-shop.com.mx/**` |
| Email confirmation | on | on |
| SMTP (Resend) | sender `no-reply@polillita-shop.com.mx` | same |
| Google provider | client ID + secret | same client ID + secret |

### 3. GitHub
1. Repository → Settings → General: make sure the repo is **Private**. The nightly backups contain customer data.
2. Settings → **Environments**, create three:
   - `test`: secret `DB_URL` = `TEST_DB_URL`
   - `production`: secret `DB_URL` = `PROD_DB_URL`. Enable **Required reviewers** and add yourself, so production migrations wait for your click.
   - `sync`, with these secrets:
     - `TEST_DB_URL`, `TEST_SUPABASE_URL` (`https://fbjeffoqtvfaikjcrbiv.supabase.co`), `TEST_SECRET_KEY`
     - `PROD_DB_URL`, `PROD_SUPABASE_URL`, `PROD_SECRET_KEY`
     - optional `TEST_KEEP_EMAILS`: your test accounts, comma-separated, kept when copying production into test
3. Create the `develop` branch from `main` and push it.

### 4. Render
1. Sign up at render.com with GitHub and allow access to the repo.
2. **New → Blueprint**, pick the repo. Render reads `render.yaml` and shows the 4 services.
3. Fill in the secret values it asks for:

| Variable | Where it comes from |
|---|---|
| `SUPABASE_URL`, `VITE_SUPABASE_URL` | the project's URL (test project for `*-test`, production for the others) |
| `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → secret (backend only, never the web services) |
| `STRIPE_SECRET_KEY` | test services `sk_test_…`; production `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | from step 6 (you can enter it after the first deploy) |

4. Add a payment method: `polillita-api` is $7/month. The other three are free.

### 5. DNS and HTTPS ⏱
1. In Render, open each service → **Settings → Custom Domains**. The domains are already listed from `render.yaml`. Each one shows the DNS record it needs.
2. At your `.com.mx` registrar, in the DNS settings, add those records:

| Name | Type | Points to |
|---|---|---|
| `@` (polillita-shop.com.mx) | `A` (or `ALIAS`/`ANAME` if offered) | the address Render shows |
| `www` | `CNAME` | `polillita-web.onrender.com` |
| `api` | `CNAME` | `polillita-api.onrender.com` |
| `test` | `CNAME` | `polillita-web-test.onrender.com` |
| `api-test` | `CNAME` | `polillita-api-test.onrender.com` |

3. ⏱ After DNS propagates (minutes to a few hours), click **Verify** in Render. It issues the HTTPS certificates by itself and redirects `http://` to `https://`.
4. Resend → Domains → add `polillita-shop.com.mx` and add its DNS records too (SPF/DKIM). After that, emails reach every customer, not just you.

### 6. Stripe
- **Test mode:** Developers → Webhooks → your existing destination → change the URL to `https://api-test.polillita-shop.com.mx/api/webhooks/stripe`. Put its signing secret in `polillita-api-test`.
- **Live mode** ⏱: activate the account (business details, bank account). Stripe may take a day or two to review it. Then:
  1. Create a webhook destination `https://api.polillita-shop.com.mx/api/webhooks/stripe` with the events `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`.
  2. Put its signing secret and your `sk_live_…` key in `polillita-api`.

### 7. Google sign-in
In Google Cloud → Google Auth Platform:
- **Branding:** add the authorized domain `polillita-shop.com.mx`.
- **Clients → your client:**
  - JavaScript origins: add `https://polillita-shop.com.mx` and `https://test.polillita-shop.com.mx`.
  - Redirect URIs: add `https://<prod-project-ref>.supabase.co/auth/v1/callback`.
- **Audience:** **Publish app**, so any Google account can sign in, not just test users.

### 8. Go live
1. Open `https://test.polillita-shop.com.mx` and go through the store:
   - sign up and receive the email
   - Google sign-in
   - order with card 4242 → paid
   - another order, cancelled at Stripe → stock back
   - admin pages and a review
2. Copy the real catalog to production: GitHub → Actions → **Database sync and backup** → Run workflow:
   1. `catalog` first **without** apply, to review the list.
   2. Again with **apply** and confirm `prod`.
3. Sign up on `https://polillita-shop.com.mx` with your admin email, then in production's SQL Editor:
   `update user_data set role = 'admin' where email = '<your email>';`
4. Place one real order with a cheap product, then refund it in Stripe.
5. The nightly backup runs by itself. Check after the first night: Actions → the latest run → Artifacts.

---

## Everyday tasks

| Task | How |
|---|---|
| Ship a change | Merge to `develop`, check it on test, then merge `develop` into `main`. |
| Change the database | Add a migration file; it's applied when merged to `develop`, and to `main` after your approval. |
| New products prepared on test | Actions → Database sync and backup → `catalog` (dry run, then apply + `prod`). Add `with_stock` to copy stock too. |
| Test with real-looking data | Actions → `prod-to-test` (apply + `test`). Customers are anonymized; test's own data is replaced. |
| Backup now | Actions → `backup`. |
| Run a sync from your computer | Set the `TEST_*`/`PROD_*` variables in the terminal, then `npm run sync:catalog` (add `-- --apply`). |

## When something goes wrong

- **A deploy broke the site:** in Render, open the service → Events → pick the last good deploy → **Rollback**. Then fix the problem on `develop`.
- **Wrong catalog copied to production:** the run saved production's previous catalog as an artifact ("catalog-backup-…"). Restore the rows from that JSON. Ask Claude for a restore script; it's a quick one.
- **Data lost in production:**
  1. Download the latest "prod-backup-…" artifact.
  2. In production's SQL Editor, empty the affected tables.
  3. Run `public-data.sql`, and `auth-data.sql` if users were lost.
  4. Upgrading production to Supabase Pro ($25/mo) adds managed daily backups with one-click restore.
- **Test site is slow on the first visit:** the free test backend sleeps after 15 minutes idle and takes about a minute to wake up. Production doesn't sleep.
- **Supabase test project paused:** a free project pauses after 7 days without use. Open it in Supabase and click **Restore**.
