import { randomUUID } from "crypto";
import Stripe from "stripe";

// In-memory stand-in for the parts of Stripe the backend uses, for tests
// (STRIPE_MODE=fake). Nothing is sent to Stripe. Webhook signatures use the
// real Stripe helpers, so signature checks still run for real.

type Params = Stripe.Checkout.SessionCreateParams;

export interface FakeSession {
  id: string;
  object: "checkout.session";
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid";
  amount_total: number;
  currency: string;
  url: string;
  created: number;
  expires_at: number;
  locale: string | undefined;
  success_url: string | undefined;
  cancel_url: string | undefined;
  client_reference_id: string | null;
  metadata: Record<string, string>;
  line_items: { description: string; unit_amount: number; quantity: number; amount_total: number }[];
}

const sessions = new Map<string, FakeSession>();

function stripeError(message: string) {
  return Object.assign(new Error(message), { type: "StripeInvalidRequestError" });
}

// Where the fake payment page is served (see modules/test-stripe).
const pageUrl = (id: string) =>
  `${process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api`}/__test/stripe/${id}`;

export function createFakeStripe() {
  return {
    checkout: {
      sessions: {
        async create(params: Params) {
          const now = Math.floor(Date.now() / 1000);
          const id = `cs_test_fake_${randomUUID().replace(/-/g, "")}`;
          const line_items = (params.line_items ?? []).map((item) => {
            const unit_amount = item.price_data?.unit_amount ?? 0;
            const quantity = item.quantity ?? 1;
            return {
              description: String(item.price_data?.product_data?.name ?? ""),
              unit_amount,
              quantity,
              amount_total: unit_amount * quantity
            };
          });

          const session: FakeSession = {
            id,
            object: "checkout.session",
            status: "open",
            payment_status: "unpaid",
            amount_total: line_items.reduce((sum, item) => sum + item.amount_total, 0),
            currency: params.line_items?.[0]?.price_data?.currency ?? "mxn",
            url: pageUrl(id),
            created: now,
            expires_at: params.expires_at ?? now + 24 * 60 * 60,
            locale: params.locale,
            success_url: params.success_url,
            cancel_url: params.cancel_url,
            client_reference_id: params.client_reference_id ?? null,
            metadata: { ...(params.metadata as Record<string, string>) },
            line_items
          };

          sessions.set(id, session);
          return { ...session };
        },

        async retrieve(id: string) {
          const session = sessions.get(id);
          if (!session) throw stripeError(`No such checkout.session: '${id}'`);
          return { ...session };
        },

        async expire(id: string) {
          const session = sessions.get(id);
          if (!session) throw stripeError(`No such checkout.session: '${id}'`);
          if (session.status !== "open") throw stripeError("Only open sessions can be expired");
          session.status = "expired";
          return { ...session };
        }
      }
    },

    webhooks: new Stripe("sk_test_fake").webhooks
  };
}

// Test controls: what a customer (or Stripe) would do on the real page.
export const fakeStripeControl = {
  get(id: string) {
    return sessions.get(id);
  },
  all() {
    return [...sessions.values()];
  },
  // The customer paid. amountTotal overrides what was charged (to test mismatches).
  complete(id: string, options: { paid?: boolean; amountTotal?: number } = {}) {
    const session = sessions.get(id);
    if (!session) throw stripeError(`No such checkout.session: '${id}'`);
    session.status = "complete";
    session.payment_status = options.paid === false ? "unpaid" : "paid";
    if (options.amountTotal !== undefined) session.amount_total = options.amountTotal;
    return { ...session };
  },
  expire(id: string) {
    const session = sessions.get(id);
    if (!session) throw stripeError(`No such checkout.session: '${id}'`);
    session.status = "expired";
    return { ...session };
  },
  reset() {
    sessions.clear();
  }
};
