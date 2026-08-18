import { api } from "./axios";
import { request } from "./request";

export const createCheckoutSession = async (orderId: string) => {
  return request<{ checkout_url: string }>(
    api.post("/payments/create-checkout-session", {
      order_id: orderId,
    })
  );
};