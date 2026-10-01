import { LocalizedText } from "../../utils/localized";

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  sort_order: number;
}

export interface Product {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  price: number;
  offer_price: number | null;
  stock: number;
  category_id: string | null;
  category?: Category | null;
  franchise: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// The only fields an admin can set on a product.
export interface ProductInput {
  name: LocalizedText;
  description: LocalizedText | null;
  price: number;
  offer_price: number | null;
  stock: number;
  category_id: string | null;
  franchise: string | null;
}
