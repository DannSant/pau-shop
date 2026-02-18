export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  offer_price: number | null;
  stock: number;
  category: string;
  franchise: string;
  created_at?: string;
}
