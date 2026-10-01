import { supabase } from "../../config/supabase";
import { LocalizedText } from "../../utils/localized";

export async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, sort_order")
    .order("sort_order")
    .order("created_at");

  if (error) throw error;
  return data;
}

// "Figuras de Acción" -> "figuras-de-accion"
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(input: { name: LocalizedText; sort_order: number }) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ slug: slugify(input.name.es), name: input.name, sort_order: input.sort_order })
    .select("id, slug, name, sort_order")
    .single();

  if (error) throw error;
  return data;
}

// The slug never changes, so links like /browse?category=<slug> keep working.
export async function updateCategory(
  id: string | string[],
  input: { name?: LocalizedText; sort_order?: number }
) {
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select("id, slug, name, sort_order")
    .maybeSingle();

  if (error) throw error;
  return data;
}
