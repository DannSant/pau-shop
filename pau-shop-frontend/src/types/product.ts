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
  franchise: string;
  created_at?: string;
  product_images: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  is_thumbnail: boolean;
}
