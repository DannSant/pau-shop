export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  offer_price?: number | null;
  stock: number;
  category?: string;
  franchise?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  offer_price?: number;
  stock?: number;
  category?: string;
  franchise?: string;
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {}
