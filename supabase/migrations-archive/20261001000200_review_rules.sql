-- Review rules and per-product score summary.
--   * score must be 1-5; comment is optional, up to 1000 characters
--   * one review per user per product (edits replace it)
--   * updated_at is set when a review is edited
--   * product_review_stats: average score and number of reviews per product
-- Who may review (a delivered order containing the product) is checked by
-- the backend; writes with the public key are already blocked by RLS.

begin;

alter table public.reviews
  add column if not exists updated_at timestamptz,
  add constraint reviews_score_range check (score between 1 and 5),
  add constraint reviews_comment_length check (comment is null or char_length(comment) <= 1000);

-- Skipped if the table already has this unique constraint under the default name.
create unique index if not exists reviews_product_id_user_id_key
  on public.reviews (product_id, user_id);

create view public.product_review_stats
with (security_invoker = true) as
select
  product_id,
  round(avg(score)::numeric, 1) as average,
  count(*)::integer as count
from public.reviews
group by product_id;

commit;
