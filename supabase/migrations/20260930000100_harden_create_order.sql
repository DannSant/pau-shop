-- Hardens create_order:
--   * Only the backend (service_role) may call it; it used to be callable with
--     the public key, for any user id.
--   * Quantities must be positive whole numbers (a negative quantity used to
--     lower the total and increase stock).
--   * Product rows are locked before the stock check, so two simultaneous
--     orders can't both take the last units.
--   * The shipping address must belong to the user.
--   * Unknown products raise an error instead of producing a null subtotal.
--   * Duplicate lines for the same product are merged before the stock check.

begin;

create or replace function public.create_order(p_user_id uuid, p_shipping_address uuid, p_items jsonb)
 returns uuid
 language plpgsql
 set search_path = public
as $function$
declare
  v_order_id uuid;
  v_line record;
  v_subtotal numeric := 0;
  v_tax numeric;
  v_import_tax numeric;
  v_shipping numeric;
  v_total numeric;
  v_requested integer;
  v_found integer;
begin

  if not exists (
    select 1 from shipping_addresses
    where id = p_shipping_address and user_id = p_user_id
  ) then
    raise exception 'Invalid shipping address';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  -- Shape check first, so the numeric casts below are safe.
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where coalesce(jsonb_typeof(e->'product_id'), '') <> 'string'
       or coalesce(jsonb_typeof(e->'quantity'), '') <> 'number'
  ) then
    raise exception 'Invalid order item';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where (e->>'quantity')::numeric <= 0
       or (e->>'quantity')::numeric <> trunc((e->>'quantity')::numeric)
  ) then
    raise exception 'Invalid item quantity';
  end if;

  -- Lock the products in a fixed order (avoids deadlocks between orders).
  perform 1
  from products
  where id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_items) e)
  order by id
  for update;

  select count(distinct (e->>'product_id')::uuid)
  into v_requested
  from jsonb_array_elements(p_items) e;

  select count(*)
  into v_found
  from products
  where id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_items) e);

  if v_found <> v_requested then
    raise exception 'Product not found';
  end if;

  -- Stock check and subtotal, one line per product.
  for v_line in
    select p.id, p.stock, coalesce(p.offer_price, p.price) as unit_price, i.quantity
    from (
      select (e->>'product_id')::uuid as product_id,
             sum((e->>'quantity')::integer) as quantity
      from jsonb_array_elements(p_items) e
      group by 1
    ) i
    join products p on p.id = i.product_id
  loop
    if v_line.stock < v_line.quantity then
      raise exception 'Insufficient stock';
    end if;

    v_subtotal := v_subtotal + v_line.unit_price * v_line.quantity;
  end loop;

  select *
  into v_subtotal, v_tax, v_import_tax, v_shipping, v_total
  from calculate_order_totals(v_subtotal);

  insert into orders(
    user_id,
    shipping_address_id,
    subtotal,
    tax,
    import_tax,
    shipping_fee,
    total_amount,
    status
  )
  values(
    p_user_id,
    p_shipping_address,
    v_subtotal,
    v_tax,
    v_import_tax,
    v_shipping,
    v_total,
    'pending'
  )
  returning id into v_order_id;

  for v_line in
    select p.id, p.name, coalesce(p.offer_price, p.price) as unit_price, i.quantity
    from (
      select (e->>'product_id')::uuid as product_id,
             sum((e->>'quantity')::integer) as quantity
      from jsonb_array_elements(p_items) e
      group by 1
    ) i
    join products p on p.id = i.product_id
  loop
    insert into order_items(order_id, product_id, product_name, unit_price, quantity)
    values (v_order_id, v_line.id, v_line.name, v_line.unit_price, v_line.quantity);

    update products
    set stock = stock - v_line.quantity
    where id = v_line.id;
  end loop;

  return v_order_id;

end;
$function$;

-- Only the backend calls this (with the service key).
revoke execute on function public.create_order(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(uuid, uuid, jsonb) to service_role;

commit;
