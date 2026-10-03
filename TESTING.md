# Tests

Every suite runs against a **local** Supabase (Docker) and a **fake Stripe**, so tests never touch the live database or the Stripe account. The only exception is the optional live Stripe test.

## One-time setup

1. Install and start **Docker Desktop**.
2. `npm install` in the repo root, in `pau-shop-backend` and in `pau-shop-frontend`.
3. `npm run db:start`. The first run downloads the Supabase images.

## Running

From the repo root:

| Command | What it runs | Time |
|---|---|---|
| `npm run test:backend` | **API + database:** every endpoint's success and failure cases, plus database rules (stock, cancellations, permissions). Vitest + Supertest. | ~40 s |
| `npm run test:frontend` | **Components:** forms, messages and states, with the backend faked (MSW). No database needed. | ~10 s |
| `npm run test:e2e` | **Browser flows:** sign up/in/out, catalog and search, addresses, checkout and payment (fake Stripe page), orders, profile, admin products/categories/orders, reviews and moderation. Playwright; starts its own servers on ports 4100/5174. | ~1 min |
| `npm run test:e2e:stripe` | **Optional:** one real payment on Stripe's *test-mode* page with card 4242. Needs internet and the Stripe test key in `pau-shop-backend/.env`. | ~30 s |
| `npm test` | Backend, frontend and browser suites (not the live Stripe one). | ~2 min |

While working on something: `npm run test:watch` inside `pau-shop-backend` or `pau-shop-frontend` reruns tests on save. `npx playwright test e2e/checkout.spec.ts --headed` shows the browser.

When a browser test fails, the report with screenshots and a step-by-step trace is in `e2e/report` (`npx playwright show-report e2e/report`).

## How it stays away from real data

- `pau-shop-backend/.env.test` points at `http://127.0.0.1:54321` (local Supabase) and sets `STRIPE_MODE=fake`. The test helpers refuse to run against any other address.
- **Fake Stripe** (`src/lib/stripe.fake.ts`):
  - It keeps payment sessions in memory.
  - Webhook signatures use Stripe's real code, so they're still checked.
  - The browser tests pay on a stand-in page served by the backend (`/api/__test/stripe/...`). That page only exists in fake mode, and fake mode is refused when `NODE_ENV=production`.
- Each suite starts by emptying the local database.

## Where things are

| Path | Contents |
|---|---|
| `pau-shop-backend/tests/api/` | One file per backend module. |
| `pau-shop-backend/tests/db/` | Database rules checked directly. |
| `pau-shop-backend/tests/helpers/` | Database reset, test data factories, request helpers. |
| `pau-shop-frontend/src/**/*.test.ts(x)` | Component and unit tests, next to the code they test. |
| `pau-shop-frontend/src/test/` | Test setup, fake API server, render helper. |
| `e2e/` | Browser specs, with `support/` for helpers and `fixtures/` for files. |
| `supabase/` | Database schema and local setup; see `supabase/README.md`. |
