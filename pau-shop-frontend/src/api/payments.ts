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

// Came back from Stripe without paying: closes the payment and releases the
// order's stock. Returns the order's status afterwards ("cancelled", or "paid"
// if the payment went through after all).
export const cancelCheckout = async (orderId: string) => {
  return request<{ status: string }>(
    api.post("/payments/cancel", { order_id: orderId })
  );
};
