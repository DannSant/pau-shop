-- Multi-language product text.
--
-- Translatable text is stored as jsonb keyed by language, e.g.
--   {"es": "Botella Nuka", "en": "Nuka Bottle"}
-- Spanish ("es") is required; other languages are optional.
--
-- Existing values are kept by wrapping them as Spanish.
-- Runs as one transaction: any error rolls everything back.

begin;

-- 1. Categories -------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint categories_name_has_es
    check (jsonb_typeof(name) = 'object' and coalesce(name->>'es', '') <> '')
);

alter table public.categories enable row level security;

create policy "Categories are readable by everyone"
  on public.categories for select
  using (true);

insert into public.categories (slug, name)
select distinct
  trim(both '-' from lower(regexp_replace(category, '[^a-zA-Z0-9]+', '-', 'g'))),
  jsonb_build_object('es', category)
from public.products
where category is not null and category <> '';

-- 2. Products ---------------------------------------------------------------

alter table public.products
  add column category_id uuid references public.categories(id) on delete restrict;

update public.products p
set category_id = c.id
from public.categories c
where c.name->>'es' = p.category;

alter table public.products drop column category;

alter table public.products
  alter column name type jsonb using jsonb_build_object('es', name),
  alter column description type jsonb
    using case when description is null then null
               else jsonb_build_object('es', description) end;

alter table public.products
  add constraint products_name_has_es
    check (jsonb_typeof(name) = 'object' and coalesce(name->>'es', '') <> ''),
  add constraint products_description_is_object
    check (description is null or jsonb_typeof(description) = 'object');

-- 3. Order items: name as it was at purchase time --------------------------

alter table public.order_items
  alter column product_name type jsonb using jsonb_build_object('es', product_name);

-- create_order needs no change: it copies products.name into
-- order_items.product_name through a `record`, so the value stays jsonb.

commit;
