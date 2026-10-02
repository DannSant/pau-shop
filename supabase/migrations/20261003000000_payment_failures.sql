-- Payments that don't complete.
--   * Totals are rounded to cents (the total used to come out as 431.125).
--   * New payment status 'cancelled' (with cancelled_at): the customer left
--     the payment page, the payment link expired or the payment failed.
--   * cancel_pending_order(): cancels an unpaid order and returns its stock,
--     in one step. Paid or already cancelled orders are left untouched, so
--     stock is never returned twice.

begin;

create or replace function public.calculate_order_totals(p_subtotal numeric)
 returns table(subtotal numeric, tax numeric, import_tax numeric, shipping_fee numeric, total numeric)
 language plpgsql
as $function$
declare
  tax_rate numeric := 0.085;
  import_tax_rate numeric := 0.16;
  shipping numeric := 400;
begin
  subtotal := round(p_subtotal, 2);
  tax := round(subtotal * tax_rate, 2);
  import_tax := round(subtotal * import_tax_rate, 2);
  shipping_fee := shipping;
  total := subtotal + tax + import_tax + shipping_fee;
  return next;
end;
$function$;

-- Replace any existing check on orders.status with one that allows 'cancelled'.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~ '\mstatus\M'
      and pg_get_constraintdef(oid) !~ 'shipping_status'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end;
$$;

alter table public.orders
  add column if not exists cancelled_at timestamptz,
  add constraint orders_status_valid check (status in ('pending', 'paid', 'cancelled'));

-- Returns true if the order was cancelled now, false if it wasn't pending.
create function public.cancel_pending_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  -- Lock the order so a payment confirmation can't happen halfway through.
  select status into v_status from orders where id = p_order_id for update;

  if v_status is distinct from 'pending' then
    return false;
  end if;

  update orders
  set status = 'cancelled', cancelled_at = now()
  where id = p_order_id;

  update products p
  set stock = p.stock + i.quantity
  from (
    select product_id, sum(quantity) as quantity
    from order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) i
  where p.id = i.product_id;

  return true;
end;
$$;

revoke execute on function public.cancel_pending_order(uuid) from public, anon, authenticated;
grant execute on function public.cancel_pending_order(uuid) to service_role;

commit;
