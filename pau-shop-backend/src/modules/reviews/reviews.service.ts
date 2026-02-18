import { supabase } from "../../config/supabase";
import { CreateReviewDTO } from "./reviews.types";

export async function getProductReviews(productId: string | string[]) {
    const { data, error } = await supabase
        .from("reviews")
        .select(`
      id,
      score,
      comment,
      created_at,
      user_data(name)
    `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function upsertReview(
    userId: string,
    productId: string | string[],
    input: CreateReviewDTO
) {
    if (input.score < 1 || input.score > 5) {
        throw new Error("Score must be between 1 and 5");
    }

    const { data, error } = await supabase
        .from("reviews")
        .upsert({
            product_id: productId,
            user_id: userId,
            score: input.score,
            comment: input.comment
        }, {
            onConflict: "product_id,user_id"
        }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteReview(userId: string, productId: string | string[]) {
    const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", userId);

    if (error) throw error;
}
