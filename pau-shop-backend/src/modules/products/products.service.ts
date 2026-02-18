import { supabase } from "../../config/supabase";
import { CreateProductDTO, UpdateProductDTO } from "./products.types";

export async function getAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProduct(input: CreateProductDTO) {
  if (input.offer_price && input.offer_price > input.price) {
    throw new Error("Offer price cannot be greater than price");
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...input,
      stock: input.stock ?? 0
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string | string[], input: UpdateProductDTO) {
  if (
    input.offer_price !== undefined &&
    input.price !== undefined &&
    input.offer_price > input.price
  ) {
    throw new Error("Offer price cannot be greater than price");
  }

  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string | string[]) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
