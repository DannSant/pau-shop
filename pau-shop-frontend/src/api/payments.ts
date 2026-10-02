import { api } from "./axios";
import { request } from "./request";
import { language } from "../i18n";

export const createCheckoutSession = async (orderId: string) => {
  return request<{ checkout_url: string }>(
    api.post("/payments/create-checkout-session", {
      order_id: orderId,
      // Stripe's page and product names in the store's language.
      language,
    })
  );
};