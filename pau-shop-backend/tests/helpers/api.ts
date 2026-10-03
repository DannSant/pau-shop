import request from "supertest";
import app from "../../src/app";
import { stripe } from "../../src/lib/stripe";

// Requests against the Express app, optionally signed in.
export const api = {
  get: (path: string, token?: string) => withToken(request(app).get(`/api${path}`), token),
  post: (path: string, body?: object, token?: string) =>
    withToken(request(app).post(`/api${path}`), token).send(body ?? {}),
  put: (path: string, body?: object, token?: string) =>
    withToken(request(app).put(`/api${path}`), token).send(body ?? {}),
  patch: (path: string, body?: object, token?: string) =>
    withToken(request(app).patch(`/api${path}`), token).send(body ?? {}),
  delete: (path: string, token?: string) => withToken(request(app).delete(`/api${path}`), token)
};

function withToken(req: request.Test, token?: string) {
  return token ? req.set("Authorization", `Bearer ${token}`) : req;
}

// Sends a webhook event signed with the test secret, like Stripe would.
export function sendWebhook(type: string, object: object, secret = process.env.STRIPE_WEBHOOK_SECRET!) {
  const payload = JSON.stringify({ id: `evt_test_${Date.now()}`, object: "event", type, data: { object } });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  return request(app)
    .post("/api/webhooks/stripe")
    .set("Content-Type", "application/json")
    .set("Stripe-Signature", signature)
    .send(payload);
}

export { app };
