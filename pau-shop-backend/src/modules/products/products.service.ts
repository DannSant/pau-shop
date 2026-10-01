import { supabase } from "../../config/supabase";
import { ProductInput } from "./products.types";
import { getReviewStats } from "../reviews/reviews.service";

const PRODUCT_SELECT = `
  *,
  category:categories (
    id,
    slug,
    name,
    sort_order
  ),
  product_images (
    id,
    url,
    is_thumbnail
  )
`;

// Store listing: deleted products are hidden; each product includes its
// review summary as `rating`.
export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const stats = await getReviewStats(data.map((product) => product.id));
  return data.map((product) => ({
    ...product,
    rating: stats.get(product.id) ?? { average: null, count: 0 }
  }));
}

// Admin listing: either the active or the deleted products.
export async function getAdminProducts(deleted: boolean) {
  let query = supabase.from("products").select(PRODUCT_SELECT);
  query = deleted ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAdminProduct(id: string | string[]) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProduct(input: ProductInput) {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string | string[], input: Partial<ProductInput>) {
  const { data, error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Soft delete: hidden from the store and can't be ordered, but past orders
// still reference it and the admin can restore it.
export async function setProductDeleted(id: string | string[], deleted: boolean) {
  const { data, error } = await supabase
    .from("products")
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id, deleted_at")
    .maybeSingle();

  if (error) throw error;
  return data;
}
