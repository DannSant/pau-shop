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
  description?: LocalizedText | null;
  price: number;
  offer_price?: number | null;
  stock: number;
  category_id?: string | null;
  category?: Category | null;
  franchise?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDTO {
  name: LocalizedText;
  description?: LocalizedText | null;
  price: number;
  offer_price?: number;
  stock?: number;
  category_id?: string | null;
  franchise?: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}
