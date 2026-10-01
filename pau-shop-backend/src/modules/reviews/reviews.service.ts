import { supabase } from "../../config/supabase";
import { PublicReview, ReviewInput, ReviewStats } from "./reviews.types";

// "Daniel Santiago López" -> "Daniel L."
export function shortName(fullName: string | null | undefined): string | null {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function getProductReviews(productId: string | string[]) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, score, comment, created_at, updated_at, user_data(name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const reviews: PublicReview[] = data.map(({ user_data, ...review }: any) => ({
    ...review,
    author: shortName(user_data?.name)
  }));

  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((sum, r) => sum + r.score, 0) / count) * 10) / 10
    : null;

  return { average, count, reviews };
}

// Average score and review count for each of the given products.
export async function getReviewStats(productIds: string[]) {
  const stats = new Map<string, ReviewStats>();
  if (productIds.length === 0) return stats;

  const { data, error } = await supabase
    .from("product_review_stats")
    .select("product_id, average, count")
    .in("product_id", productIds);

  if (error) throw error;

  for (const row of data) {
    stats.set(row.product_id, { average: Number(row.average), count: row.count });
  }
  return stats;
}

export async function getOwnReview(userId: string, productId: string | string[]) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, score, comment, created_at, updated_at")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Only customers who received the product may review it: a paid order of
// theirs that contains it and is marked as delivered.
export async function hasReceivedProduct(userId: string, productId: string | string[]) {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, orders!inner(user_id, status, shipping_status)")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .eq("orders.status", "paid")
    .eq("orders.shipping_status", "arrived")
    .limit(1);

  if (error) throw error;
  return data.length > 0;
}

export async function productIsAvailable(productId: string | string[]) {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// Creates the user's review, or replaces it (and marks it as edited).
export async function saveReview(userId: string, productId: string | string[], input: ReviewInput) {
  const existing = await getOwnReview(userId, productId);

  const query = existing
    ? supabase
        .from("reviews")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    : supabase
        .from("reviews")
        .insert({ ...input, product_id: productId, user_id: userId });

  const { data, error } = await query
    .select("id, score, comment, created_at, updated_at")
    .single();

  if (error) throw error;
  return { review: data, created: !existing };
}

export async function deleteReview(userId: string, productId: string | string[]) {
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("product_id", productId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;
  return data.length > 0;
}
