// Admin-only endpoints (the backend checks the role on every call).
import { api } from "./axios";
import { request } from "./request";
import type { Category, Product, ProductImage } from "../types/product";
import type { LocalizedText } from "../types/localized";
import type { Address } from "../types/address";
import type { Order, OrderItem } from "./orders";

export interface ProductPayload {
  name: LocalizedText;
  description: LocalizedText | null;
  price: number;
  offer_price: number | null;
  stock: number;
  category_id: string | null;
  franchise: string | null;
}

export interface CategoryPayload {
  name: LocalizedText;
  sort_order: number;
}

export interface AdminOrder extends Omit<Order, "order_items"> {
  order_items: Pick<OrderItem, "product_name" | "quantity" | "unit_price">[];
  shipping_address: Address | null;
  customer: { id: string; name: string; email: string; phone: string | null } | null;
}

// Products
export const getAdminProducts = (deleted: boolean) =>
  request<Product[]>(api.get("/products/admin", { params: { deleted } }));

export const getAdminProduct = (id: string) =>
  request<Product>(api.get(`/products/admin/${id}`));

export const createProduct = (payload: ProductPayload) =>
  request<Product>(api.post("/products", payload));

export const updateProduct = (id: string, payload: ProductPayload) =>
  request<Product>(api.put(`/products/${id}`, payload));

export const deleteProduct = (id: string) =>
  request<unknown>(api.delete(`/products/${id}`));

export const restoreProduct = (id: string) =>
  request<unknown>(api.post(`/products/${id}/restore`));

// Product images
export const uploadProductImages = (productId: string, files: File[]) => {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return request<ProductImage[]>(api.post(`/products/${productId}/images`, form));
};

export const deleteProductImage = (productId: string, imageId: string) =>
  request<boolean>(api.delete(`/products/${productId}/images/${imageId}`));

export const setProductThumbnail = (productId: string, imageId: string) =>
  request<ProductImage>(api.patch(`/products/${productId}/images/${imageId}`));

// Categories
export const getCategories = () => request<Category[]>(api.get("/categories"));

export const createCategory = (payload: CategoryPayload) =>
  request<Category>(api.post("/categories", payload));

export const updateCategory = (id: string, payload: CategoryPayload) =>
  request<Category>(api.put(`/categories/${id}`, payload));

// Orders
export const getAdminOrders = (filters: { shipping_status?: string; payment_status?: string }) =>
  request<AdminOrder[]>(api.get("/orders/admin", { params: filters }));
