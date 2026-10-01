-- Shipping status, tracked separately from the payment status (orders.status).
--   pending -> shipped -> arrived
-- Existing orders start as 'pending'. Only admins change it, through the
-- backend (PATCH /orders/:id/shipping-status).

begin;

alter table public.orders
  add column shipping_status text not null default 'pending',
  add constraint orders_shipping_status_valid
    check (shipping_status in ('pending', 'shipped', 'arrived'));

commit;
