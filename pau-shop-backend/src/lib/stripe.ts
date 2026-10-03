import Stripe from "stripe";
import { createFakeStripe } from "./stripe.fake";

// STRIPE_MODE=fake (tests only) swaps in an in-memory Stripe; see stripe.fake.ts.
export const usingFakeStripe = process.env.STRIPE_MODE === "fake";

if (usingFakeStripe && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_MODE=fake can't be used in production");
}

export const stripe: Stripe = usingFakeStripe
  ? (createFakeStripe() as unknown as Stripe)
  : new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover"
    });
