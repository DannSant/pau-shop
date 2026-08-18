import { api } from "./axios";
import { request } from "./request";

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
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  shipping_address_id: string;
  total_amount: number;
  status: string;
  created_at: string;
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