import { api } from "./axios";
import { request } from "./request";

export interface OrderTotals {
  subtotal: number;
  tax: number;
  import_tax: number;
  shipping_fee: number;
  total: number;
}

export const calculateTotals = async (amount: number) => {
  return request<OrderTotals>(
    api.get(`/orders/total/calculate?amount=${amount}`)
  );
};