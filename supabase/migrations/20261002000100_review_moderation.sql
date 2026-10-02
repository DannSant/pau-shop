-- Review moderation for admins.
--   * deleted_reviews: a copy of every review an admin deleted (customers
--     deleting their own review are not recorded)
--   * review_bans: customers who may no longer write or edit reviews
--   * admin_delete_reviews(): deletes reviews and records them, in one step
--   * admin_review_list / admin_user_review_summary: what the admin page lists
-- Only the backend (service role) can read or change any of this.

begin;

create table public.deleted_reviews (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null,
  user_id uuid not null references public.user_data(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  -- Product name when the review was deleted, as stored in products.name.
  product_name jsonb,
  score integer not null,
  comment text,
  review_created_at timestamptz not null,
  review_updated_at timestamptz,
  deleted_at timestamptz not null default now(),
  deleted_by uuid references public.user_data(id) on delete set null
);

create index deleted_reviews_user_id_idx
  on public.deleted_reviews (user_id, deleted_at desc);

create table public.review_bans (
  user_id uuid primary key references public.user_data(id) on delete cascade,
  banned_at timestamptz not null default now(),
  banned_by uuid references public.user_data(id) on delete set null,
  -- Internal note for other admins; never shown to the customer.
  note text check (note is null or char_length(note) <= 500)
);

-- RLS on with no policies: nobody but the service role can read or write.
alter table public.deleted_reviews enable row level security;
alter table public.review_bans enable row level security;
revoke all on public.deleted_reviews, public.review_bans from anon, authenticated;

-- Deletes the given reviews and keeps a copy of each in deleted_reviews.
-- Returns how many were deleted.
create function public.admin_delete_reviews(p_review_ids uuid[], p_admin_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke execute on function public.admin_delete_reviews(uuid[], uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_reviews(uuid[], uuid) to service_role;

-- Every review with its product and author, newest activity (posted or
-- edited) first when ordered by activity_at.
create view public.admin_review_list
with (security_invoker = true) as
select
  r.id,
  r.product_id,
  r.user_id,
  r.score,
  r.comment,
  r.created_at,
  r.updated_at,
  coalesce(r.updated_at, r.created_at) as activity_at,
  p.name as product_name,
  u.name as user_name,
  u.email as user_email,
  (b.user_id is not null) as user_banned
from public.reviews r
left join public.products p on p.id = r.product_id
left join public.user_data u on u.id = r.user_id
left join public.review_bans b on b.user_id = r.user_id;

-- One row per customer with their review counts and ban status.
create view public.admin_user_review_summary
with (security_invoker = true) as
select
  u.id,
  u.name,
  u.email,
  u.phone,
  u.role,
  u.created_at,
  coalesce(rc.review_count, 0)::integer as review_count,
  coalesce(dc.deleted_count, 0)::integer as deleted_review_count,
  dc.last_deleted_at,
  b.banned_at,
  b.note as ban_note
from public.user_data u
left join (
  select user_id, count(*) as review_count
  from public.reviews
  group by user_id
) rc on rc.user_id = u.id
left join (
  select user_id, count(*) as deleted_count, max(deleted_at) as last_deleted_at
  from public.deleted_reviews
  group by user_id
) dc on dc.user_id = u.id
left join public.review_bans b on b.user_id = u.id;

-- The views include emails: keep them away from the public key.
revoke all on public.admin_review_list, public.admin_user_review_summary from anon, authenticated;

commit;
