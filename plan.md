# Pau Shop – Checkout Implementation Roadmap

## Current Status

Frontend checkout implementation started but paused because several endpoints require an authenticated user token.

Authentication must be implemented before continuing.

---

# Phase 1 – Authentication (Required First)

## 1. Login Page

Create a login page where the user can authenticate.

UI:

* Email
* Password
* Login button

Endpoint:
POST /auth/login

Expected response:

* access_token
* user information

---

## 2. Auth Redux Slice

Create a slice to store:

* access_token
* user data
* login status
* loading state

Example structure:

authSlice

* token
* user
* isAuthenticated
* loading
* error

---

## 3. Store Token

Persist the token so the user remains logged in after refresh.

Options:

* localStorage (simple)
* httpOnly cookies (more secure, backend dependent)

For now:
localStorage is acceptable.

---

## 4. Axios Interceptor

Modify the axios instance:

/src/api/axios.ts

Automatically attach the token:

Authorization: Bearer <token>

Example flow:

axios request
→ read token from localStorage or redux
→ attach Authorization header

---

## 5. Protected Routes

Some routes should require authentication.

Examples:

* /checkout
* /orders
* /profile

Create a component:

ProtectedRoute

Logic:
If user is not authenticated → redirect to login.

---

# Phase 2 – Checkout Totals (Resume Here After Login)

Once authentication works, resume checkout implementation.

## 6. Calculate Order Totals

Endpoint:
GET /orders/total/calculate?amount=XXX

Flow:

Cart Items
↓
Frontend calculates subtotal
↓
Redux thunk calls endpoint
↓
Backend returns:

* subtotal
* tax
* import_tax
* shipping_fee
* total

Redux stores totals in orderSlice.

---

## 7. Order Summary Component

Create component:

components/checkout/OrderSummary.tsx

Displays:

* Subtotal
* CA tax
* Import tax
* Shipping
* Total

Uses Redux orderSlice totals.

---

# Phase 3 – Address Management

## 8. Shipping Address Component

Component:
ShippingAddressSection

Features:

* Select saved address
* Add new address
* Edit address

Fields:

* name
* phone
* address_line1
* address_line2
* city
* state
* postal_code
* country

Store selected address in shippingSlice.

---

# Phase 4 – Create Order

## 9. Create Order Endpoint

Endpoint:
POST /orders

Body should include:

* cart items
* selected shipping address
* totals

Response:

* order_id
* order_status = pending

Store order_id in Redux.

---

# Phase 5 – Stripe Checkout

## 10. Create Stripe Checkout Session

Endpoint:
POST /payments/create-checkout-session

Body:

* order_id

Response:

* stripe checkout URL

Frontend:
Redirect user to Stripe Checkout.

---

# Phase 6 – Payment Confirmation

Stripe flow:

User pays
↓
Stripe webhook fires
↓
Backend marks order as:
status = paid

Frontend can display confirmation page.

---

# Phase 7 – Success Page

Create:

/checkout/success

Features:

* Order confirmation
* Order number
* Thank you message
* Link to view orders

---

# Optional Improvements (Later)

* Guest checkout
* Address auto-fill
* Coupon codes
* Shipping calculation by region
* Inventory reservation during checkout
* Payment failure retry
* Order history page

---

# Next Immediate Task

Implement **Authentication System**

Steps:

1. Auth API wrapper
2. authSlice
3. Login page
4. Axios interceptor
5. Protected routes

Once login works, resume checkout from **Step 6**.
