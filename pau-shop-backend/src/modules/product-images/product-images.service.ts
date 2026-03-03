import { supabase } from "../../config/supabase";

export async function listProductImages(productId: string | string[]) {
    const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("created_at");

    if (error) throw new Error(error.message);

    return data;
}

export async function addProductImage(
    productId: string | string[],
    input: { url: string; is_thumbnail?: boolean }
) {    
    const { data, error } = await supabase
        .from("product_images")
        .insert({
            product_id: productId,
            url: input.url,
            is_thumbnail: input.is_thumbnail ?? false
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    return data;
}

export async function deleteProductImage(imageId: string | string[]) {
    const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imageId);

    if (error) throw new Error(error.message);

    return true;
}

export async function setThumbnail(
    productId: string | string[],
    imageId: string | string[]
) {
    // Remove existing thumbnail
    const { error: resetError } = await supabase
        .from("product_images")
        .update({ is_thumbnail: false })
        .eq("product_id", productId);

    if (resetError) throw new Error(resetError.message);

    // Set new thumbnail
    const { data, error } = await supabase
        .from("product_images")
        .update({ is_thumbnail: true })
        .eq("id", imageId)
        .select()
        .single();

    if (error) throw new Error(error.message);

    return data;
}