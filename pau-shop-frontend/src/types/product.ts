import type { LocalizedText } from "./localized";

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
  category: Category | null;
  category_id?: string | null;
  franchise: string;
  // Set when an admin deletes the product (only returned to admins).
  deleted_at?: string | null;
  created_at?: string;
  product_images: ProductImage[];
  // Review summary (included in the store listing).
  rating?: ReviewStats;
}

export interface ReviewStats {
  average: number | null;
  count: number;
}

export interface ProductImage {
  id: string;
  url: string;
  is_thumbnail: boolean;
}
