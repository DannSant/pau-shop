-- Baseline: the complete database schema as of 2026-10-03.
--
-- Generated from supabase/schema-export.csv (supabase/export-schema.sql run
-- against the live project). It replaces the earlier migrations, which are
-- kept in supabase/migrations-archive/ for history. The live project already
-- matches this file; run it only on a new, empty project (see README.md).
-- Seed data (categories) is in supabase/seed.sql.

begin;

-- ======================================================================
-- Extensions (already present on Supabase; listed for completeness)
-- ======================================================================

create extension if not exists pg_graphql with schema graphql;

create extension if not exists pg_stat_statements with schema extensions;

create extension if not exists pgcrypto with schema extensions;

create extension if not exists supabase_vault with schema vault;

create extension if not exists "uuid-ossp" with schema extensions;

-- ======================================================================
-- Tables
-- ======================================================================

create table public.categories (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  name jsonb not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table public.deleted_reviews (
  id uuid default gen_random_uuid() not null,
  review_id uuid not null,
  user_id uuid not null,
  product_id uuid,
  product_name jsonb,
  score integer not null,
  comment text,
  review_created_at timestamp with time zone not null,
  review_updated_at timestamp with time zone,
  deleted_at timestamp with time zone default now() not null,
  deleted_by uuid
);

create table public.order_items (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  product_id uuid not null,
  product_name jsonb not null,
  unit_price numeric not null,
  quantity integer not null,
  created_at timestamp with time zone default now()
);

create table public.orders (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  shipping_address_id uuid not null,
  status text default 'pending'::text not null,
  total_amount numeric not null,
  created_at timestamp with time zone default now(),
  stripe_session_id text,
  subtotal numeric default 0 not null,
  tax numeric default 0 not null,
  import_tax numeric default 0 not null,
  shipping_fee numeric default 0 not null,
  paid_at timestamp with time zone,
  shipping_status text default 'pending'::text not null,
  cancelled_at timestamp with time zone
);

create table public.product_images (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  url text not null,
  is_thumbnail boolean default false,
  created_at timestamp with time zone default now()
);

create table public.products (
  id uuid default gen_random_uuid() not null,
  name jsonb not null,
  description jsonb,
  price numeric not null,
  offer_price numeric,
  stock integer default 0 not null,
  franchise text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  category_id uuid,
  deleted_at timestamp with time zone
);

create table public.review_bans (
  user_id uuid not null,
  banned_at timestamp with time zone default now() not null,
  banned_by uuid,
  note text
);

create table public.reviews (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  user_id uuid not null,
  score integer not null,
  comment text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

create table public.shipping_addresses (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  street text not null,
  exterior_number text not null,
  interior_number text,
  neighborhood text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  created_at timestamp with time zone default now(),
  first_name text default ''::text not null,
  last_name text default ''::text not null,
  phone text default ''::text not null
);

create table public.user_data (
  id uuid not null,
  name text not null,
  email text not null,
  phone text,
  role text default 'user'::text not null,
  created_at timestamp with time zone default now()
);

-- ======================================================================
-- Primary keys, unique and check constraints
-- ======================================================================

alter table public.categories add constraint categories_name_has_es CHECK (((jsonb_typeof(name) = 'object'::text) AND (COALESCE((name ->> 'es'::text), ''::text) <> ''::text)));

alter table public.categories add constraint categories_pkey PRIMARY KEY (id);

alter table public.categories add constraint categories_slug_key UNIQUE (slug);

alter table public.deleted_reviews add constraint deleted_reviews_pkey PRIMARY KEY (id);

alter table public.order_items add constraint order_items_pkey PRIMARY KEY (id);

alter table public.order_items add constraint order_items_quantity_check CHECK ((quantity > 0));

alter table public.order_items add constraint order_items_unit_price_check CHECK ((unit_price >= (0)::numeric));

alter table public.orders add constraint orders_pkey PRIMARY KEY (id);

alter table public.orders add constraint orders_shipping_status_valid CHECK ((shipping_status = ANY (ARRAY['pending'::text, 'shipped'::text, 'arrived'::text])));

alter table public.orders add constraint orders_status_valid CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])));

alter table public.orders add constraint orders_total_amount_check CHECK ((total_amount >= (0)::numeric));

alter table public.product_images add constraint product_images_pkey PRIMARY KEY (id);

alter table public.products add constraint products_description_is_object CHECK (((description IS NULL) OR (jsonb_typeof(description) = 'object'::text)));

alter table public.products add constraint products_name_has_es CHECK (((jsonb_typeof(name) = 'object'::text) AND (COALESCE((name ->> 'es'::text), ''::text) <> ''::text)));

alter table public.products add constraint products_offer_price_check CHECK ((offer_price >= (0)::numeric));

alter table public.products add constraint products_pkey PRIMARY KEY (id);

alter table public.products add constraint products_price_check CHECK ((price >= (0)::numeric));

alter table public.products add constraint products_stock_check CHECK ((stock >= 0));

alter table public.review_bans add constraint review_bans_note_check CHECK (((note IS NULL) OR (char_length(note) <= 500)));

alter table public.review_bans add constraint review_bans_pkey PRIMARY KEY (user_id);

alter table public.reviews add constraint reviews_comment_length CHECK (((comment IS NULL) OR (char_length(comment) <= 1000)));

alter table public.reviews add constraint reviews_pkey PRIMARY KEY (id);

alter table public.reviews add constraint reviews_product_id_user_id_key UNIQUE (product_id, user_id);

alter table public.reviews add constraint reviews_score_check CHECK (((score >= 1) AND (score <= 5)));

alter table public.reviews add constraint reviews_score_range CHECK (((score >= 1) AND (score <= 5)));

alter table public.shipping_addresses add constraint shipping_addresses_pkey PRIMARY KEY (id);

alter table public.user_data add constraint user_data_pkey PRIMARY KEY (id);

-- ======================================================================
-- Foreign keys
-- ======================================================================

alter table public.deleted_reviews add constraint deleted_reviews_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES user_data(id) ON DELETE SET NULL;

alter table public.deleted_reviews add constraint deleted_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

alter table public.deleted_reviews add constraint deleted_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_data(id) ON DELETE CASCADE;

alter table public.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table public.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);

alter table public.orders add constraint orders_shipping_address_id_fkey FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id);

alter table public.orders add constraint orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

alter table public.product_images add constraint product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table public.products add constraint products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;

alter table public.review_bans add constraint review_bans_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES user_data(id) ON DELETE SET NULL;

alter table public.review_bans add constraint review_bans_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_data(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

alter table public.reviews add constraint reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_data(id) ON DELETE CASCADE;

alter table public.shipping_addresses add constraint shipping_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.user_data add constraint user_data_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ======================================================================
-- Indexes
-- ======================================================================

CREATE INDEX deleted_reviews_user_id_idx ON public.deleted_reviews USING btree (user_id, deleted_at DESC);

CREATE UNIQUE INDEX one_thumbnail_per_product ON public.product_images USING btree (product_id) WHERE (is_thumbnail = true);

-- ======================================================================
-- Functions
-- ======================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_reviews(p_review_ids uuid[], p_admin_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  deleted_count integer;
begin
  with gone as (
    delete from reviews
    where id = any(p_review_ids)
    returning id, user_id, product_id, score, comment, created_at, updated_at
  )
  insert into deleted_reviews (
    review_id, user_id, product_id, product_name, score, comment,
    review_created_at, review_updated_at, deleted_by
  )
  select g.id, g.user_id, g.product_id, p.name, g.score, g.comment,
         g.created_at, g.updated_at, p_admin_id
  from gone g
  left join products p on p.id = g.product_id;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_order_totals(p_subtotal numeric)
 RETURNS TABLE(subtotal numeric, tax numeric, import_tax numeric, shipping_fee numeric, total numeric)
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_pending_order(p_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.create_order(p_user_id uuid, p_shipping_address uuid, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
  where id in (select (e->>'product_id')::uuid from jsonb_array_elements(p_items) e)
    and deleted_at is null;

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
$function$
;

-- ======================================================================
-- Views
-- ======================================================================

create or replace view public.admin_review_list with (security_invoker=true) as
 SELECT r.id,
    r.product_id,
    r.user_id,
    r.score,
    r.comment,
    r.created_at,
    r.updated_at,
    COALESCE(r.updated_at, r.created_at) AS activity_at,
    p.name AS product_name,
    u.name AS user_name,
    u.email AS user_email,
    b.user_id IS NOT NULL AS user_banned
   FROM reviews r
     LEFT JOIN products p ON p.id = r.product_id
     LEFT JOIN user_data u ON u.id = r.user_id
     LEFT JOIN review_bans b ON b.user_id = r.user_id;

create or replace view public.admin_user_review_summary with (security_invoker=true) as
 SELECT u.id,
    u.name,
    u.email,
    u.phone,
    u.role,
    u.created_at,
    COALESCE(rc.review_count, 0::bigint)::integer AS review_count,
    COALESCE(dc.deleted_count, 0::bigint)::integer AS deleted_review_count,
    dc.last_deleted_at,
    b.banned_at,
    b.note AS ban_note
   FROM user_data u
     LEFT JOIN ( SELECT reviews.user_id,
            count(*) AS review_count
           FROM reviews
          GROUP BY reviews.user_id) rc ON rc.user_id = u.id
     LEFT JOIN ( SELECT deleted_reviews.user_id,
            count(*) AS deleted_count,
            max(deleted_reviews.deleted_at) AS last_deleted_at
           FROM deleted_reviews
          GROUP BY deleted_reviews.user_id) dc ON dc.user_id = u.id
     LEFT JOIN review_bans b ON b.user_id = u.id;

create or replace view public.product_review_stats with (security_invoker=true) as
 SELECT product_id,
    round(avg(score), 1) AS average,
    count(*)::integer AS count
   FROM reviews
  GROUP BY product_id;

-- ======================================================================
-- Row level security
-- ======================================================================

alter table public.categories enable row level security;

alter table public.deleted_reviews enable row level security;

alter table public.order_items enable row level security;

alter table public.orders enable row level security;

alter table public.review_bans enable row level security;

alter table public.reviews enable row level security;

alter table public.shipping_addresses enable row level security;

alter table public.user_data enable row level security;

-- ======================================================================
-- Policies
-- ======================================================================

create policy "Categories are readable by everyone" on public.categories as permissive for select to public using (true);

create policy "Users can read own order items" on public.order_items as permissive for select to public using ((order_id IN ( SELECT orders.id
   FROM orders
  WHERE (orders.user_id = auth.uid()))));

create policy "Users can read own orders" on public.orders as permissive for select to public using ((auth.uid() = user_id));

create policy "Public can read reviews" on public.reviews as permissive for select to public using (true);

create policy "Users can delete own reviews" on public.reviews as permissive for delete to public using ((auth.uid() = user_id));

create policy "Users can insert own reviews" on public.reviews as permissive for insert to public with check ((auth.uid() = user_id));

create policy "Users can update own reviews" on public.reviews as permissive for update to public using ((auth.uid() = user_id));

create policy "Users can delete own addresses" on public.shipping_addresses as permissive for delete to public using ((auth.uid() = user_id));

create policy "Users can insert own addresses" on public.shipping_addresses as permissive for insert to public with check ((auth.uid() = user_id));

create policy "Users can read own addresses" on public.shipping_addresses as permissive for select to public using ((auth.uid() = user_id));

create policy "Users can update own addresses" on public.shipping_addresses as permissive for update to public using ((auth.uid() = user_id));

create policy "Users can read own profile" on public.user_data as permissive for select to public using ((auth.uid() = id));

create policy "Users can update own profile" on public.user_data as permissive for update to public using ((auth.uid() = id));

-- ======================================================================
-- Table and view permissions
-- ======================================================================

revoke all on public.admin_review_list from anon, authenticated, service_role;
grant DELETE on public.admin_review_list to service_role;
grant INSERT on public.admin_review_list to service_role;
grant MAINTAIN on public.admin_review_list to service_role;
grant REFERENCES on public.admin_review_list to service_role;
grant SELECT on public.admin_review_list to service_role;
grant TRIGGER on public.admin_review_list to service_role;
grant TRUNCATE on public.admin_review_list to service_role;
grant UPDATE on public.admin_review_list to service_role;

revoke all on public.admin_user_review_summary from anon, authenticated, service_role;
grant DELETE on public.admin_user_review_summary to service_role;
grant INSERT on public.admin_user_review_summary to service_role;
grant MAINTAIN on public.admin_user_review_summary to service_role;
grant REFERENCES on public.admin_user_review_summary to service_role;
grant SELECT on public.admin_user_review_summary to service_role;
grant TRIGGER on public.admin_user_review_summary to service_role;
grant TRUNCATE on public.admin_user_review_summary to service_role;
grant UPDATE on public.admin_user_review_summary to service_role;

revoke all on public.categories from anon, authenticated, service_role;
grant MAINTAIN on public.categories to anon;
grant SELECT on public.categories to anon;
grant MAINTAIN on public.categories to authenticated;
grant SELECT on public.categories to authenticated;
grant DELETE on public.categories to service_role;
grant INSERT on public.categories to service_role;
grant MAINTAIN on public.categories to service_role;
grant REFERENCES on public.categories to service_role;
grant SELECT on public.categories to service_role;
grant TRIGGER on public.categories to service_role;
grant TRUNCATE on public.categories to service_role;
grant UPDATE on public.categories to service_role;

revoke all on public.deleted_reviews from anon, authenticated, service_role;
grant DELETE on public.deleted_reviews to service_role;
grant INSERT on public.deleted_reviews to service_role;
grant MAINTAIN on public.deleted_reviews to service_role;
grant REFERENCES on public.deleted_reviews to service_role;
grant SELECT on public.deleted_reviews to service_role;
grant TRIGGER on public.deleted_reviews to service_role;
grant TRUNCATE on public.deleted_reviews to service_role;
grant UPDATE on public.deleted_reviews to service_role;

revoke all on public.order_items from anon, authenticated, service_role;
grant MAINTAIN on public.order_items to anon;
grant SELECT on public.order_items to anon;
grant MAINTAIN on public.order_items to authenticated;
grant SELECT on public.order_items to authenticated;
grant DELETE on public.order_items to service_role;
grant INSERT on public.order_items to service_role;
grant MAINTAIN on public.order_items to service_role;
grant REFERENCES on public.order_items to service_role;
grant SELECT on public.order_items to service_role;
grant TRIGGER on public.order_items to service_role;
grant TRUNCATE on public.order_items to service_role;
grant UPDATE on public.order_items to service_role;

revoke all on public.orders from anon, authenticated, service_role;
grant MAINTAIN on public.orders to anon;
grant SELECT on public.orders to anon;
grant MAINTAIN on public.orders to authenticated;
grant SELECT on public.orders to authenticated;
grant DELETE on public.orders to service_role;
grant INSERT on public.orders to service_role;
grant MAINTAIN on public.orders to service_role;
grant REFERENCES on public.orders to service_role;
grant SELECT on public.orders to service_role;
grant TRIGGER on public.orders to service_role;
grant TRUNCATE on public.orders to service_role;
grant UPDATE on public.orders to service_role;

revoke all on public.product_images from anon, authenticated, service_role;
grant MAINTAIN on public.product_images to anon;
grant SELECT on public.product_images to anon;
grant MAINTAIN on public.product_images to authenticated;
grant SELECT on public.product_images to authenticated;
grant DELETE on public.product_images to service_role;
grant INSERT on public.product_images to service_role;
grant MAINTAIN on public.product_images to service_role;
grant REFERENCES on public.product_images to service_role;
grant SELECT on public.product_images to service_role;
grant TRIGGER on public.product_images to service_role;
grant TRUNCATE on public.product_images to service_role;
grant UPDATE on public.product_images to service_role;

revoke all on public.product_review_stats from anon, authenticated, service_role;
grant MAINTAIN on public.product_review_stats to anon;
grant SELECT on public.product_review_stats to anon;
grant MAINTAIN on public.product_review_stats to authenticated;
grant SELECT on public.product_review_stats to authenticated;
grant DELETE on public.product_review_stats to service_role;
grant INSERT on public.product_review_stats to service_role;
grant MAINTAIN on public.product_review_stats to service_role;
grant REFERENCES on public.product_review_stats to service_role;
grant SELECT on public.product_review_stats to service_role;
grant TRIGGER on public.product_review_stats to service_role;
grant TRUNCATE on public.product_review_stats to service_role;
grant UPDATE on public.product_review_stats to service_role;

revoke all on public.products from anon, authenticated, service_role;
grant MAINTAIN on public.products to anon;
grant SELECT on public.products to anon;
grant MAINTAIN on public.products to authenticated;
grant SELECT on public.products to authenticated;
grant DELETE on public.products to service_role;
grant INSERT on public.products to service_role;
grant MAINTAIN on public.products to service_role;
grant REFERENCES on public.products to service_role;
grant SELECT on public.products to service_role;
grant TRIGGER on public.products to service_role;
grant TRUNCATE on public.products to service_role;
grant UPDATE on public.products to service_role;

revoke all on public.review_bans from anon, authenticated, service_role;
grant DELETE on public.review_bans to service_role;
grant INSERT on public.review_bans to service_role;
grant MAINTAIN on public.review_bans to service_role;
grant REFERENCES on public.review_bans to service_role;
grant SELECT on public.review_bans to service_role;
grant TRIGGER on public.review_bans to service_role;
grant TRUNCATE on public.review_bans to service_role;
grant UPDATE on public.review_bans to service_role;

revoke all on public.reviews from anon, authenticated, service_role;
grant MAINTAIN on public.reviews to anon;
grant SELECT on public.reviews to anon;
grant MAINTAIN on public.reviews to authenticated;
grant SELECT on public.reviews to authenticated;
grant DELETE on public.reviews to service_role;
grant INSERT on public.reviews to service_role;
grant MAINTAIN on public.reviews to service_role;
grant REFERENCES on public.reviews to service_role;
grant SELECT on public.reviews to service_role;
grant TRIGGER on public.reviews to service_role;
grant TRUNCATE on public.reviews to service_role;
grant UPDATE on public.reviews to service_role;

revoke all on public.shipping_addresses from anon, authenticated, service_role;
grant MAINTAIN on public.shipping_addresses to anon;
grant SELECT on public.shipping_addresses to anon;
grant MAINTAIN on public.shipping_addresses to authenticated;
grant SELECT on public.shipping_addresses to authenticated;
grant DELETE on public.shipping_addresses to service_role;
grant INSERT on public.shipping_addresses to service_role;
grant MAINTAIN on public.shipping_addresses to service_role;
grant REFERENCES on public.shipping_addresses to service_role;
grant SELECT on public.shipping_addresses to service_role;
grant TRIGGER on public.shipping_addresses to service_role;
grant TRUNCATE on public.shipping_addresses to service_role;
grant UPDATE on public.shipping_addresses to service_role;

revoke all on public.user_data from anon, authenticated, service_role;
grant MAINTAIN on public.user_data to anon;
grant SELECT on public.user_data to anon;
grant MAINTAIN on public.user_data to authenticated;
grant SELECT on public.user_data to authenticated;
grant DELETE on public.user_data to service_role;
grant INSERT on public.user_data to service_role;
grant MAINTAIN on public.user_data to service_role;
grant REFERENCES on public.user_data to service_role;
grant SELECT on public.user_data to service_role;
grant TRIGGER on public.user_data to service_role;
grant TRUNCATE on public.user_data to service_role;
grant UPDATE on public.user_data to service_role;

-- ======================================================================
-- Function permissions
-- ======================================================================

revoke all on function public.admin_delete_reviews(p_review_ids uuid[], p_admin_id uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_reviews(p_review_ids uuid[], p_admin_id uuid) to service_role;

revoke all on function public.calculate_order_totals(p_subtotal numeric) from public, anon, authenticated;
grant execute on function public.calculate_order_totals(p_subtotal numeric) to service_role;
grant execute on function public.calculate_order_totals(p_subtotal numeric) to anon;
grant execute on function public.calculate_order_totals(p_subtotal numeric) to authenticated;
grant execute on function public.calculate_order_totals(p_subtotal numeric) to public;

revoke all on function public.cancel_pending_order(p_order_id uuid) from public, anon, authenticated;
grant execute on function public.cancel_pending_order(p_order_id uuid) to service_role;

revoke all on function public.create_order(p_user_id uuid, p_shipping_address uuid, p_items jsonb) from public, anon, authenticated;
grant execute on function public.create_order(p_user_id uuid, p_shipping_address uuid, p_items jsonb) to service_role;

-- ======================================================================
-- Storage buckets
-- ======================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('product-images', 'product-images', true, null, null) on conflict (id) do nothing;

-- ======================================================================
-- Default permissions (not part of the export)
-- ======================================================================

-- Tables created later give the public roles no write access either; every
-- write goes through the backend (service role).
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger
  on tables from anon, authenticated;

commit;
