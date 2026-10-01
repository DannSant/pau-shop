import { api } from "./axios";
import { request } from "./request";
import type { LocalizedText } from "../types/localized";

export interface OrderTotals {
  subtotal: number;
  tax: number;
  import_tax: number;
  shipping_fee: number;
  total: number;
}

export interface CreateOrderPayload {
  shipping_address_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: LocalizedText;
  unit_price: number;
  quantity: number;
  image_url: string | null;
}

export type ShippingStatus = "pending" | "shipped" | "arrived";

export interface Order {
  id: string;
  user_id: string;
  shipping_address_id: string;
  subtotal: number;
  tax: number;
  import_tax: number;
  shipping_fee: number;
  total_amount: number;
  status: string;
  shipping_status: ShippingStatus;
  created_at: string;
  paid_at: string | null;
  order_items?: { product_name: LocalizedText; quantity: number }[];
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export const calculateTotals = async (amount: number) => {
  return request<OrderTotals>(
    api.get(`/orders/total/calculate?amount=${amount}`)
  );
};

export const createOrder = async (payload: CreateOrderPayload) => {
  return request<string>(
    api.post("/orders", payload)
  );
};

export const getOrderDetail = async (orderId: string) => {
  return request<OrderDetail>(
    api.get(`/orders/${orderId}`)
  );
};

export const getMyOrders = async () => {
  return request<Order[]>(
    api.get("/orders")
  );
};

// Admin only (the backend checks the role).
export const updateShippingStatus = async (
  orderId: string,
  shippingStatus: ShippingStatus
) => {
  return request<Order>(
    api.patch(`/orders/${orderId}/shipping-status`, { shipping_status: shippingStatus })
  );
};
