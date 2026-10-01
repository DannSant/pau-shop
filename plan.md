# Pau Shop – Roadmap

Online store for a California-based client who buys items in the US and resells them in Mexico. The UI is in Spanish, prices are in MXN, and payments go through Stripe.

- **Frontend:** `pau-shop-frontend/`, React + Redux Toolkit + Tailwind (Vite).
- **Backend:** `pau-shop-backend/`, Express 5 + TypeScript, calls Supabase with the service key.
- **Database / auth:** Supabase. Schema changes are tracked in `supabase/migrations/` (one file per change, run once, in filename order, in the SQL Editor).

---

# ✅ Implemented

## Catalog
- Home page with featured products (products that have an offer price).
- Browse page with category and franchise filters (`?category=<slug>&franchise=<name>`).
- Product page: image gallery, price/offer price, stock, add to cart, similar products (same franchise).

## Cart & checkout
- Cart page with quantity controls and stock check (cart lives in Redux, not persisted).
- Checkout page: select/add/edit shipping address, order summary with totals from `calculate_order_totals` (California tax 8.5%, import tax 16%, shipping $400).
- Order creation through the `create_order` database function (checks stock, lowers stock, saves the product name on the order).
- Stripe Checkout session (checks the order belongs to the logged-in user) and a webhook that marks the order `paid` and sets `paid_at`.
- Order success page.

## Authentication
- Login page with Spanish error messages mapped from Supabase error codes.
- Sign-up page: name, phone, email, password + confirmation. Email confirmation is ON; the "Continue with Google" button is a placeholder, not wired up yet.
- Emails sent through Resend SMTP. For now, without a verified domain, emails only reach the Resend account owner's address.
- The session stays in sync across tabs, and the token refreshes automatically (`useAuthInit` listens for auth changes).
- Route guards: `ProtectedRoute` for signed-in pages, `GuestRoute` keeps signed-in users away from `/login` and `/signup`. After login you land on home if the cart is empty, otherwise on the cart.

## Profile & orders
- `user_data` row created automatically on first sign-in from the sign-up name/phone; `role` is always `user`.
- `GET /users/me` (creates the profile if missing) and `PATCH /users/me` (name and phone only).
- Profile page:
  - **General tab:** name, email, phone, member since; edit name/phone; notice if the phone is missing.
  - **Order history tab** (`/profile?tab=orders`): date, status pill, total, item summary, newest first.
- Order details page (`/orders/:id`): items with images, subtotal/taxes/shipping/total, status pill, placeholder for shipping status.

## Localization
- All UI text lives in `pau-shop-frontend/src/i18n/es.ts` and is read through `t.*`; dates use `locale` (`es-MX`).
- Database text is stored as JSON per language, `{"es": "...", "en": "..."}`, with Spanish required:
  - `products.name`
  - `products.description`
  - `categories.name` (categories have their own table with a `slug`)
  - `order_items.product_name`
- The frontend shows these through `localize()` in `src/i18n/index.ts`.

## Security hardening
- `create_order` rejects negative, zero or fractional quantities, unknown products, and other users' shipping addresses. It merges duplicate lines and locks product rows so two orders can't oversell.
- Only the backend's service key can run `create_order`.
- `POST /orders` validates its input before calling the database.

---

# ⏳ Pending from the last session

1. **Run `supabase/migrations/20260930000100_harden_create_order.sql`** in the Supabase SQL Editor, if not done yet. Do **not** re-run `20260930000000_localized_product_text.sql`; it's already applied.
2. **After that:** check the pages in the browser against the real data, and do a Stripe test-mode checkout, to confirm `create_order` still works with the service key only.

---

# 🔜 Next session

## 1. Shipping status
- New `orders.shipping_status` column: `pending` → `shipped` → `arrived`. It's separate from the payment `status`, which stays `pending`/`paid`. Migration default is `pending`, with a check constraint on the allowed values.
- Show it on the order details page (the "Estado del envío" section is already there as a placeholder) and as a pill in the order history.
- Spanish labels in `es.ts`, e.g. `orders.shippingStatus.{pending, shipped, arrived}`.

## 2. Admin page (only for `role = 'admin'`)
- Frontend: enable the admin routes in `AppRouter.tsx`. `AdminRoute.tsx` already exists and the routes are commented out. Show an "Admin" navbar link only to admins.
- **Products:**
  - create, update and **soft delete**: add a `products.deleted_at` column; public listings hide deleted products, while past orders still reference them.
  - backend endpoints already exist behind `requireAdmin`: `POST/PUT/DELETE /products`. `DELETE` must become the soft delete.
  - the form edits `name`/`description` per language (`es` required, `en` optional), plus category, franchise, price, offer price and stock.
  - product images have endpoints already (`/products/:id/images`).
- **Orders:**
  - list all orders and update their shipping status
  - needs a new admin endpoint, e.g. `PATCH /orders/:id/shipping-status`, restricted by `requireAdmin`.
- Admins also need their `role` read from `user_data`: today `state.auth.user.role` comes from Supabase and is always `authenticated`, not `admin`.

## 3. Reviews
- A `reviews` table and endpoints already exist:
  - `GET/POST/PUT/DELETE /products/:id/reviews`, one review per user per product (upsert)
  - `score` between 1 and 5, plus a `comment`.
- **Missing:** only allow a review if the user has **purchased** the product, meaning a `paid` order containing it. Check this in the backend, not just the UI.
- Product page:
  - list all reviews: name, score, comment, date
  - form to write or edit your own review, shown only to eligible users
  - average score with review count, or "No hay reseñas" when there are none.
- Spanish text in `es.ts`.

---

# 💡 Later / ideas
- Language switcher + `en.ts` (database text already supports `en`).
- Verify a domain in Resend so confirmation emails reach every customer.
- Google sign-in (button already in place).
- Stock is reduced when the order is created, not when it's paid. Unpaid orders keep their stock reserved forever; consider releasing it after a timeout or reducing stock only on payment.
- Search page (`/search` is still a placeholder).
- Persist the cart across page reloads.
