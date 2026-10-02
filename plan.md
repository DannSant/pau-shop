# Polillita Shop – Roadmap

Online store (shown to customers as **Polillita Shop**; the repo and folders keep the `pau-shop` name) for a California-based client who buys items in the US and resells them in Mexico. The UI is in Spanish, prices are in MXN, and payments go through Stripe.

- **Frontend:** `pau-shop-frontend/`, React + Redux Toolkit + Tailwind (Vite).
- **Backend:** `pau-shop-backend/`, Express 5 + TypeScript, calls Supabase with the service key.
- **Database / auth:** Supabase. Schema changes are tracked in `supabase/migrations/` (one file per change, run once, in filename order, in the SQL Editor).

---

# ✅ Implemented

## Catalog
- Home page with featured products (products that have an offer price).
- Browse page with category and franchise filters (`?category=<slug>&franchise=<name>`) and a search bar that filters as you type by name and description (ignores case and accents; kept in the URL as `?q=`). The separate `/search` page was removed.
- Product page: image gallery, price/offer price, stock, add to cart, similar products (same franchise).

## Cart & checkout
- Cart page with quantity controls and stock check. The cart is saved in localStorage and emptied on the order success page.
- Checkout page: select/add/edit shipping address, order summary with totals from `calculate_order_totals` (California tax 8.5%, import tax 16%, shipping $400).
- Order creation through the `create_order` database function (checks stock, lowers stock, saves the product name on the order).
- Stripe Checkout session (checks the order belongs to the logged-in user) and a webhook that marks the order `paid` and sets `paid_at`.
- Order success page.

## Authentication
- Login page with Spanish error messages mapped from Supabase error codes.
- Sign-up page: name, phone, email, password + confirmation. Email confirmation is ON.
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
- All UI text lives in `pau-shop-frontend/src/i18n/es.ts` (Spanish) and `en.ts` (English, typed against `es.ts` so a missing key fails the build), read through `t.*`. Dates use `locale` (`es-MX` / `en-US`).
- **ES | EN switcher** in the navbar. Spanish is the default; the choice is saved in localStorage (`language`) and switching reloads the page (cart, session and search survive). `<html lang>` follows the language.
- Stripe Checkout opens in the same language (`es-419` / `en`) with product names in that language (the frontend sends `language` to `/payments/create-checkout-session`).
- Database text is stored as JSON per language, `{"es": "...", "en": "..."}`, with Spanish required:
  - `products.name`
  - `products.description`
  - `categories.name` (categories have their own table with a `slug`)
  - `order_items.product_name`
- The frontend shows these through `localize()` in `src/i18n/index.ts` (falls back to Spanish when there's no English text).

## Security hardening
- `create_order` rejects negative, zero or fractional quantities, unknown products, and other users' shipping addresses. It merges duplicate lines and locks product rows so two orders can't oversell.
- Only the backend's service key can run `create_order`.
- `POST /orders` validates its input before calling the database.
- The public (publishable) key can't write to any table: signed-in customers could previously set their own `role` to `admin`, change product prices, add product images and insert reviews directly. Fixed in `20261002000000_block_public_writes.sql`; all writes go through the backend.

---

# ⏳ Pending

- 3 test orders from August (2026-08-16, 2026-08-18 ×2) are paid in Stripe but only for the product price ($25 of $431.13, the old undercharging bug), so the backend leaves them as "Pago pendiente" and logs a warning. Decide: refund/delete them (test data) or mark them paid by hand.

1. Before going live: publish the Google OAuth consent screen and add the production domain (Google Cloud authorized domains + client origins, Supabase redirect URLs). Rename the app in the Google consent screen and the Resend sender name to Polillita Shop if they still say PauShop.

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

## 4. Google sign-in ✅ done
- One Supabase call (`signInWithOAuth`) for both login and sign-up: new Google accounts are created automatically, existing ones just sign in. The "Continuar con Google" button is on both pages.
- Google users get their name automatically, but no phone: they're sent to `/complete-profile` (name + phone) before using the rest of the site. `POST /orders` also refuses orders without a phone.
- The destination ("go back to /checkout") is kept in sessionStorage for the trip to Google.
- **The cart is now saved in localStorage** (survives reloads and the trip to Google) and is emptied on the order success page.
- Fixed: the app had two Supabase clients, which would both try to read the Google sign-in result.
- Configured in Google Cloud (OAuth client, testing mode) and Supabase (Google provider, redirect URL `http://localhost:5173/**`); tested with a real Google account.

## 5. Shop name + search ✅ done
- Customer-facing name changed to **Polillita Shop** (navbar, home title, browser tab).
- Search bar on the browse page replaces the `/search` placeholder page.

## 6. 404 page + language switcher ✅ done
- Any unknown address shows a "Página no encontrada" page with links to home and browse.
- ES | EN switcher in the navbar (see Localization). The navbar now wraps to two rows on phones.


## 7. Review moderation ✅ done
- Admin tab **Usuarios y reseñas** with two views:
  - **Reseñas recientes:** every review, newest posted/edited first, with product, author, email and a delete button.
  - **Usuarios:** search by name/email; sorted by deleted reviews, then reviews.
- User page `/admin/users/:id`: contact info, counts, review ban (with internal note) / lift ban, published reviews (delete one or all), deleted-review history (what, when, by which admin).
- Admin deletes are hard deletes (the average updates) and a copy goes to `deleted_reviews`. Customers deleting their own review aren't recorded.
- Banned customers (`review_bans`) can't post or edit reviews (backend returns 403); the product page says so. Their existing reviews stay unless deleted. Admins can't be banned.
- Database: `20261002000100_review_moderation.sql` (`deleted_reviews`, `review_bans`, `admin_delete_reviews()`, views `admin_review_list` and `admin_user_review_summary`, none readable with the public key). Backend: `/moderation/*` (admins only).
---

## 8. Payment failures ✅ done
- **Stripe now charges the full order total:** products plus California tax, import tax and shipping as separate lines (it used to charge only the products). Totals are rounded to cents, and an order is only marked paid when Stripe's amount matches.
- New payment status **cancelled** ("Cancelado"). `cancel_pending_order()` cancels an unpaid order and returns its stock in one step (never twice).
- An unpaid order is cancelled (stock returned) when:
  - the customer comes back from Stripe without paying (`cancel_url` → `/checkout?cancelled_order=…` → `POST /payments/cancel`, which also closes the Stripe page)
  - the Stripe page expires (now 31 minutes instead of 24 hours; webhook `checkout.session.expired`)
  - a delayed payment fails (`checkout.session.async_payment_failed`, ready for OXXO)
  - the same customer starts a new order (their earlier unpaid one is cancelled first)
  - the backend's check every 10 minutes finds it older than its payment page (covers missed webhooks; it also marks paid orders whose confirmation was missed).
- Webhook: only marks paid when `payment_status` is `paid`; ignores repeated events; returns 500 on database errors so Stripe retries.
- One Stripe page per order (reused while open); orders that aren't pending can't start a payment.
- Checkout page: "Redirigiendo al pago..." and disabled button while starting; clear messages (out of stock, unavailable product, missing phone, generic); "El pago no se completó" notice when coming back.
- Success page: "Confirmando tu pago..." while waiting (also asks Stripe directly); explains cancelled orders; empties the cart only once the order is paid.
- Database: `20261003000000_payment_failures.sql`.
- **Stripe setup:** the webhook must send `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`.

---

# 💡 Later / ideas
- OXXO payments (cash at a store): the payment flow already handles delayed payments; needs enabling in Stripe and adding to `payment_method_types`.
- Supabase auth emails (confirmation) are only in Spanish; Supabase uses one template for everyone.
- Verify a domain in Resend so confirmation emails reach every customer.
- Stock is reduced when the order is created, not when it's paid. Unpaid orders keep their stock reserved forever; consider releasing it after a timeout or reducing stock only on payment.
- Let customers report a review, so admins see flagged ones first.
