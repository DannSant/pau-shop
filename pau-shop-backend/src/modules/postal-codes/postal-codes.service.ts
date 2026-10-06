import { supabase } from "../../config/supabase";

export interface PostalCodeInfo {
  postal_code: string;
  state: string;
  city: string;
  neighborhoods: string[];
}

// One postal code from the SEPOMEX catalog, or null if it doesn't exist.
// Rural codes have no city, so the municipality is used instead.
export async function findPostalCode(code: string): Promise<PostalCodeInfo | null> {
  const { data, error } = await supabase
    .from("postal_codes")
    .select("neighborhood, municipality, city, state")
    .eq("postal_code", code)
    .order("neighborhood");

  if (error) throw error;
  if (!data.length) return null;

  const [first] = data;
  return {
    postal_code: code,
    state: first.state,
    city: first.city || first.municipality,
    neighborhoods: [...new Set(data.map((row) => row.neighborhood))]
  };
}
