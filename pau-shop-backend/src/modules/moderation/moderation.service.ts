import { supabase } from "../../config/supabase";
import {
  AdminReview,
  DeletedReview,
  Page,
  PAGE_SIZE,
  UserModerationDetail,
  UserReviewSummary
} from "./moderation.types";

const REVIEW_COLUMNS =
  "id, product_id, user_id, score, comment, created_at, updated_at, product_name, user_name, user_email, user_banned";

// Asks for one row more than a page to know whether there are more.
function toPage<T>(rows: T[]): Page<T> {
  return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

// Every review, most recently posted or edited first.
export async function listRecentReviews(offset: number): Promise<Page<AdminReview>> {
  const { data, error } = await supabase
    .from("admin_review_list")
    .select(REVIEW_COLUMNS)
    .order("activity_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  if (error) throw error;
  return toPage(data as AdminReview[]);
}

// Customers with the most deleted reviews first, then the most reviews.
export async function listUsers(search: string, offset: number): Promise<Page<UserReviewSummary>> {
  let query = supabase
    .from("admin_user_review_summary")
    .select("*")
    .order("deleted_review_count", { ascending: false })
    .order("review_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  // Characters that would break the filter syntax are dropped.
  const term = search.replace(/[,()"\\%*:]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) throw error;
  return toPage(data as UserReviewSummary[]);
}

export async function getUserSummary(userId: string) {
  const { data, error } = await supabase
    .from("admin_user_review_summary")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserReviewSummary | null;
}

export async function getUserModerationDetail(userId: string): Promise<UserModerationDetail | null> {
  const user = await getUserSummary(userId);
  if (!user) return null;

  const [reviews, deleted, ban] = await Promise.all([
    supabase
      .from("admin_review_list")
      .select(REVIEW_COLUMNS)
      .eq("user_id", userId)
      .order("activity_at", { ascending: false }),
    supabase
      .from("deleted_reviews")
      .select(
        "id, product_id, product_name, score, comment, review_created_at, deleted_at, admin:user_data!deleted_reviews_deleted_by_fkey(name)"
      )
      .eq("user_id", userId)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("review_bans")
      .select("admin:user_data!review_bans_banned_by_fkey(name)")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (reviews.error) throw reviews.error;
  if (deleted.error) throw deleted.error;
  if (ban.error) throw ban.error;

  return {
    user,
    banned_by_name: (ban.data as any)?.admin?.name ?? null,
    reviews: reviews.data as AdminReview[],
    deleted: deleted.data.map(({ admin, ...row }: any) => ({
      ...row,
      deleted_by_name: admin?.name ?? null
    })) as DeletedReview[]
  };
}

// Deletes the reviews and keeps a copy of each (see admin_delete_reviews).
export async function deleteReviewsAsAdmin(reviewIds: string[], adminId: string) {
  if (reviewIds.length === 0) return 0;

  const { data, error } = await supabase.rpc("admin_delete_reviews", {
    p_review_ids: reviewIds,
    p_admin_id: adminId
  });

  if (error) throw error;
  return data as number;
}

export async function deleteAllUserReviews(userId: string, adminId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId);

  if (error) throw error;
  return deleteReviewsAsAdmin(data.map((r) => r.id), adminId);
}

// Banning again only updates the note.
export async function banUser(userId: string, adminId: string, note: string | null) {
  const { error } = await supabase
    .from("review_bans")
    .upsert({ user_id: userId, banned_by: adminId, note }, { onConflict: "user_id", ignoreDuplicates: false });

  if (error) throw error;
}

export async function unbanUser(userId: string) {
  const { error } = await supabase.from("review_bans").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function isBannedFromReviews(userId: string) {
  const { data, error } = await supabase
    .from("review_bans")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
