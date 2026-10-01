import { randomUUID } from "crypto";
import { supabase } from "../../config/supabase";

export const BUCKET = "product-images";

// Allowed upload types and the file extension each one is saved with.
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${BUCKET}/`;

export async function listProductImages(productId: string | string[]) {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("created_at");

  if (error) throw new Error(error.message);

  return data;
}

// Uploads the files to the bucket and records them. The first image of a
// product without a thumbnail becomes its thumbnail.
// Returns null if the product doesn't exist.
export async function uploadProductImages(
  productId: string,
  files: { buffer: Buffer; mimetype: string }[]
) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) throw new Error(productError.message);
  if (!product) return null;

  const { count, error: countError } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("is_thumbnail", true);

  if (countError) throw new Error(countError.message);

  let needsThumbnail = !count;
  const images = [];

  for (const file of files) {
    const path = `${productId}/${randomUUID()}.${IMAGE_TYPES[file.mimetype]}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw new Error(uploadError.message);

    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { data, error } = await supabase
      .from("product_images")
      .insert({ product_id: productId, url, is_thumbnail: needsThumbnail })
      .select()
      .single();

    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(error.message);
    }

    needsThumbnail = false;
    images.push(data);
  }

  return images;
}

// Deletes the record and, if it lives in our bucket, the file. If it was the
// thumbnail, the oldest remaining image takes its place.
// Returns false if the image doesn't belong to the product.
export async function deleteProductImage(
  productId: string | string[],
  imageId: string | string[]
) {
  const { data: image, error: findError } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!image) return false;

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw new Error(error.message);

  const markerIndex = image.url.indexOf(PUBLIC_PATH_MARKER);
  if (markerIndex !== -1) {
    const path = decodeURIComponent(image.url.slice(markerIndex + PUBLIC_PATH_MARKER.length));
    await supabase.storage.from(BUCKET).remove([path]);
  }

  if (image.is_thumbnail) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("created_at")
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabase.from("product_images").update({ is_thumbnail: true }).eq("id", next.id);
    }
  }

  return true;
}

// Returns null if the image doesn't belong to the product.
export async function setThumbnail(
  productId: string | string[],
  imageId: string | string[]
) {
  const { data: image, error: findError } = await supabase
    .from("product_images")
    .select("id")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!image) return null;

  const { error: resetError } = await supabase
    .from("product_images")
    .update({ is_thumbnail: false })
    .eq("product_id", productId);

  if (resetError) throw new Error(resetError.message);

  const { data, error } = await supabase
    .from("product_images")
    .update({ is_thumbnail: true })
    .eq("id", imageId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}
