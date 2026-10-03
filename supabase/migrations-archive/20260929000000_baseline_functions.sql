-- Baseline: database functions as they existed before migrations were tracked
-- in the repo. Already applied in Supabase; recorded here for history.
-- Re-running this file is harmless (create or replace with the same body).

CREATE OR REPLACE FUNCTION public.create_order(p_user_id uuid, p_shipping_address uuid, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_order_id uuid;
  v_product record;
  v_item jsonb;
  v_subtotal numeric := 0;

  v_tax numeric;
  v_import_tax numeric;
  v_shipping numeric;
  v_total numeric;
begin

  -- calculate subtotal
  for v_item in select * from jsonb_array_elements(p_items)
  loop

    select *
    into v_product
    from products
    where id = (v_item->>'product_id')::uuid;

    if v_product.stock < (v_item->>'quantity')::int then
        raise exception 'Insufficient stock';
    end if;

   v_subtotal := v_subtotal + (coalesce(v_product.offer_price, v_product.price) * (v_item->>'quantity')::int );

  end loop;

  -- call totals calculator
  select *
  into v_subtotal, v_tax, v_import_tax, v_shipping, v_total
  from calculate_order_totals(v_subtotal);

  -- create order
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

  -- insert items
  for v_item in select * from jsonb_array_elements(p_items)
  loop

    select *
    into v_product
    from products
    where id = (v_item->>'product_id')::uuid;

    insert into order_items(
        order_id,
        product_id,
        product_name,
        unit_price,
        quantity
    )
    values(
        v_order_id,
        v_product.id,
        v_product.name,
        coalesce(v_product.offer_price, v_product.price),
        (v_item->>'quantity')::int
    );

    update products
    set stock = stock - (v_item->>'quantity')::int
    where id = v_product.id;

  end loop;

  return v_order_id;

end;
$function$;

--

CREATE OR REPLACE FUNCTION public.calculate_order_totals(p_subtotal numeric)
 RETURNS TABLE(subtotal numeric, tax numeric, import_tax numeric, shipping_fee numeric, total numeric)
 LANGUAGE plpgsql
AS $function$
declare
    tax_rate numeric := 0.085;
    import_tax_rate numeric := 0.16;
    shipping numeric := 400;
begin

    subtotal := p_subtotal;
    tax := subtotal * tax_rate;
    import_tax := subtotal * import_tax_rate;
    shipping_fee := shipping;
    total := subtotal + tax + import_tax + shipping_fee;

    return next;

end;
$function$

