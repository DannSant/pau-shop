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

# ⏳ Pending

1. **Google sign-in setup** (Google Cloud + Supabase), then a real Google test. The code is done and tested; see "Google sign-in" below.

---

# 🔜 Next session

## 1. Shipping status ✅ done
- `orders.shipping_status` (`pending` → `shipped` → `arrived`), separate from the payment `status`.
- Admin-only `PATCH /orders/:id/shipping-status`: unpaid orders can't be shipped; going back to `pending` is allowed. The frontend helper is `updateShippingStatus()` in `api/orders.ts`, ready for the admin page.
- Shown as a pill on the order details page (with a short description) and in the order history (paid orders only).

## 2. Admin page ✅ done
- `/admin` (admins only; "Admin" link in the navbar). The role is read from `user_data` and `AdminRoute` waits for it to load.
- **Productos:** create/edit with Spanish + optional English text, soft delete (`products.deleted_at`) and restore, image upload to the `product-images` bucket (max 10 × 5 MB), main image, image delete (also removes the file). Deleted products are hidden from the store and `create_order` rejects them.
- **Categorías:** create, rename, reorder; the slug never changes.
- **Pedidos:** all orders with customer contact, address and items; filters by shipping/payment status; shipping-status dropdown (unpaid orders can't ship).
- Backend: `/products/admin`, `/products/:id/restore`, `/products/:id/images` (multipart, `multer`), `/categories`, `/orders/admin`. Product create/update only accept known fields.

## 3. Reviews ✅ done
- Only customers with a **paid** order containing the product that's marked **Entregado** can review it (checked by the backend; public-key writes are blocked by RLS).
- One review per customer per product: 1–5 stars, optional comment (max 1000 characters); editing marks it "(editada)"; customers can delete their own.
- Public list shows "Daniel S." and never the `user_id`. Deleted products can't be reviewed.
- Product page: average + count under the title (or "No hay reseñas"), a reviews section with summary, star-picker form and list. Product cards show small stars when a product has reviews.
- Database: `20261001000200_review_rules.sql` (score/comment checks, unique per user+product, `updated_at`, `product_review_stats` view). Endpoints: `GET /products/:id/reviews`, `GET /products/:id/reviews/me`, `PUT`/`POST`/`DELETE /products/:id/reviews`.

---

## 4. Google sign-in ✅ code done (setup pending)
- One Supabase call (`signInWithOAuth`) for both login and sign-up: new Google accounts are created automatically, existing ones just sign in. The "Continuar con Google" button is on both pages.
- Google users get their name automatically, but no phone: they're sent to `/complete-profile` (name + phone) before using the rest of the site. `POST /orders` also refuses orders without a phone.
- The destination ("go back to /checkout") is kept in sessionStorage for the trip to Google.
- **The cart is now saved in localStorage** (survives reloads and the trip to Google) and is emptied on the order success page.
- Fixed: the app had two Supabase clients, which would both try to read the Google sign-in result.
- Setup still needed: Google Cloud OAuth client + Supabase Google provider + redirect URL `http://localhost:5173/**`.

---

# 💡 Later / ideas
- Language switcher + `en.ts` (database text already supports `en`).
- Verify a domain in Resend so confirmation emails reach every customer.
- Google sign-in (button already in place).
- Stock is reduced when the order is created, not when it's paid. Unpaid orders keep their stock reserved forever; consider releasing it after a timeout or reducing stock only on payment.
- Search page (`/search` is still a placeholder).
- Admin moderation of reviews (hide or delete inappropriate ones).
