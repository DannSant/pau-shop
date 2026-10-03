# Database (Supabase)

| Path | What it is |
|---|---|
| `migrations/20261004000000_baseline.sql` | The complete schema: tables, constraints, functions, views, security rules, permissions, storage bucket. |
| `migrations/` (later files) | Changes made after the baseline, one file per change. |
| `seed.sql` | Starting data (categories). |
| `export-schema.sql` | Read-only query that exports a database's schema, one statement per row. |
| `schema-export.csv` | That export, taken from the live project when the baseline was made. |
| `migrations-archive/` | The migrations from before the baseline (history only; never applied). |
| `config.toml` | Settings for the local copy used by the tests. |

## Changing the schema

1. Add a new file in `migrations/` named `YYYYMMDDHHMMSS_what_it_does.sql`.
2. Run it in the live project's **SQL Editor**.
3. Run `npm run db:reset` so the local test database gets it too, then run the tests.

## Local database (for tests)

Needs Docker Desktop running. From the repo root:

```
npm run db:start   # first run downloads the images (a few GB)
npm run db:reset   # rebuild from the baseline + later migrations + seed
npm run db:stop
```

Local Studio (a dashboard for the local database): http://127.0.0.1:54323

## Checking that a database matches the repo

Run `export-schema.sql` against the database, save the result, and compare it with `schema-export.csv`. Each row is one object, so differences show exactly what changed.

## Go-live checklist (new, empty project)

1. **Create** the Supabase project. Use the same region you'll deploy the backend to.
2. **Schema:** in the SQL Editor, run `migrations/20261004000000_baseline.sql`, then any later migration files in order, then `seed.sql`.
3. **Admin:** sign up in the app, then run the following in the SQL Editor:
   `update user_data set role = 'admin' where email = '<your email>';`
4. **Auth settings:**
   - URL Configuration: set the Site URL to the store's domain, and add Redirect URLs `https://<domain>/**`.
   - Email: confirmation **on**. SMTP: Resend, sending from the verified domain.
   - Google provider: the client ID and secret. In Google Cloud, add the domain to the authorized domains and JavaScript origins, and publish the consent screen.
5. **Stripe (live mode):**
   - Add a webhook destination `https://<backend-domain>/api/webhooks/stripe` with these events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`.
   - Put its signing secret in the backend's `STRIPE_WEBHOOK_SECRET`.
6. **Environment variables:**
   - Backend: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`.
   - Frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.
   - Never set `STRIPE_MODE` in production; the backend refuses to start with `STRIPE_MODE=fake` when `NODE_ENV=production`.
7. **Check:** run `export-schema.sql` on the new project and compare it with `schema-export.csv`. Then place a real order with a small amount and refund it.
