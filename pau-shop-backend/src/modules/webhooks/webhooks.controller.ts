import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import { cancelOrder, cancelUnpaidOrder, markOrderPaid } from "../payments/payments.service";

// Stripe events this handler uses (enable them on the webhook in Stripe):
//   checkout.session.completed               payment page finished
//   checkout.session.async_payment_succeeded paid later (e.g. OXXO)
//   checkout.session.async_payment_failed    never paid (e.g. OXXO voucher expired)
//   checkout.session.expired                 payment page expired unpaid
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
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        // A completed page can still be unpaid for delayed methods; those
        // are confirmed later by async_payment_succeeded.
        if (session.payment_status === "paid" && (await markOrderPaid(session))) {
          console.log("✅ Order marked as paid:", orderId);
        }
        break;

      case "checkout.session.async_payment_failed":
        // The page is "complete" but the money never arrived.
        if (orderId && (await cancelOrder(orderId))) {
          console.log(`Order ${orderId} cancelled: delayed payment failed`);
        }
        break;

      case "checkout.session.expired":
        if (orderId) {
          const status = await cancelUnpaidOrder(orderId);
          console.log(`Order ${orderId} after ${event.type}: ${status}`);
        }
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    // 500 makes Stripe retry the event later.
    console.error("❌ Webhook handler error:", err.message);
    res.status(500).send("Webhook handler failed");
  }
}
