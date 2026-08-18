import { Request, Response } from "express";
import Stripe from "stripe";
import { supabase } from "../../config/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.order_id;

      if (!orderId) {
        throw new Error("Missing order_id in metadata");
      }

      // ✅ Update order status
      await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

      console.log("✅ Order marked as paid:", orderId);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err.message);
    res.status(500).send("Webhook handler failed");
  }
}