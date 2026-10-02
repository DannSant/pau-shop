import Stripe from "stripe";
import { stripe } from "../../lib/stripe";
import { supabase } from "../../config/supabase";
import { localize } from "../../utils/localized";

export type Language = "es" | "en";

// Stripe's minimum is 30 minutes; an unpaid order's stock is released when
// its payment page expires.
const CHECKOUT_LIFETIME_SECONDS = 31 * 60;

// Labels for the non-product lines on Stripe's page.
const LINE_LABELS: Record<Language, { tax: string; importTax: string; shipping: string }> = {
  es: { tax: "Impuesto de California (8.5%)", importTax: "Impuesto de importación (16%)", shipping: "Envío" },
  en: { tax: "California tax (8.5%)", importTax: "Import tax (16%)", shipping: "Shipping" }
};

export class PaymentError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export const toCents = (amount: number) => Math.round(Number(amount) * 100);

async function findOrder(orderId: string, userId?: string) {
  let query = supabase
    .from("orders")
    .select(
      "id, user_id, status, subtotal, tax, import_tax, shipping_fee, total_amount, stripe_session_id, order_items(quantity, unit_price, product_name)"
    )
    .eq("id", orderId);

  // Customers only see their own orders; same answer if it isn't theirs.
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function retrieveSession(sessionId: string | null) {
  if (!sessionId) return null;
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

export async function createCheckoutSession(orderId: string, userId: string, language: Language = "es") {
  const order = await findOrder(orderId, userId);
  if (!order) throw new PaymentError("Order not found", 404);
  if (order.status !== "pending") throw new PaymentError("Order is not awaiting payment", 409);

  // One payment page per order: reuse it while it's still open, so the same
  // order can't be paid twice on two pages.
  const existing = await retrieveSession(order.stripe_session_id);
  if (existing?.status === "open" && existing.url) {
    return { checkout_url: existing.url };
  }
  if (existing?.status === "complete") {
    throw new PaymentError("Order is not awaiting payment", 409);
  }

  const labels = LINE_LABELS[language];
  const line = (name: string, amount: number, quantity = 1) => ({
    price_data: { currency: "mxn", product_data: { name }, unit_amount: toCents(amount) },
    quantity
  });

  // Products (names saved on the order, in the customer's language), then
  // taxes and shipping, so Stripe charges the order total.
  const line_items = [
    ...order.order_items.map((item: any) =>
      line(localize(item.product_name, language), item.unit_price, item.quantity)
    ),
    line(labels.tax, order.tax),
    line(labels.importTax, order.import_tax),
    line(labels.shipping, order.shipping_fee)
  ].filter((item) => item.price_data.unit_amount > 0);

  const charged = line_items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0);
  if (charged !== toCents(order.total_amount)) {
    // Never send the customer to pay an amount that differs from the order.
    console.error(`Order ${orderId}: lines add up to ${charged} cents, total is ${toCents(order.total_amount)}`);
    throw new PaymentError("Order total doesn't match its lines", 500);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",

    // Stripe's page in the store's language (es-419: Latin American Spanish).
    locale: language === "en" ? "en" : "es-419",
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_LIFETIME_SECONDS,

    success_url: `${process.env.FRONTEND_URL}/order-success?order_id=${orderId}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout?cancelled_order=${orderId}`,

    client_reference_id: orderId,
    metadata: { order_id: orderId, user_id: userId },
    payment_intent_data: { metadata: { order_id: orderId, user_id: userId } }
  });

  const { error } = await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", orderId);
  if (error) throw error;

  return { checkout_url: session.url };
}

// Marks the order paid if Stripe confirms the full amount was paid.
// Returns false when the payment can't be accepted for this order.
export async function markOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) throw new Error(`Session ${session.id} has no order_id`);

  const order = await findOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  if (order.status === "paid") return true; // already handled (Stripe can resend events)

  if (session.payment_status !== "paid") return false;

  if (session.currency !== "mxn" || session.amount_total !== toCents(order.total_amount)) {
    console.error(
      `❌ Order ${orderId}: Stripe charged ${session.amount_total} ${session.currency}, order total is ${toCents(order.total_amount)} mxn. Not marked as paid; check it in Stripe.`
    );
    return false;
  }

  if (order.status === "cancelled") {
    console.error(`❌ Order ${orderId} was paid but is cancelled (its stock was returned). Refund it or restore it by hand.`);
    return false;
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending");

  if (error) throw error;
  return true;
}

// Asks Stripe directly whether an unpaid order has been paid, in case the
// webhook hasn't arrived yet. Only ever marks orders as paid. Returns true if
// the order is now paid.
export async function confirmPaymentWithStripe(orderId: string, sessionId: string | null) {
  const session = await retrieveSession(sessionId);
  if (session?.status !== "complete" || session.metadata?.order_id !== orderId) return false;
  return markOrderPaid(session);
}

// Cancels an unpaid order and returns its stock (see cancel_pending_order).
export async function cancelOrder(orderId: string) {
  const { data, error } = await supabase.rpc("cancel_pending_order", { p_order_id: orderId });
  if (error) throw error;
  return data as boolean;
}

// Customer came back from Stripe without paying (or abandoned an earlier
// attempt). Closes the payment page first, so it can't be paid afterwards,
// then cancels the order. Returns the order's resulting status.
export async function cancelUnpaidOrder(orderId: string, userId?: string) {
  const order = await findOrder(orderId, userId);
  if (!order) throw new PaymentError("Order not found", 404);
  if (order.status !== "pending") return order.status as string;

  let session = await retrieveSession(order.stripe_session_id);

  if (session?.status === "open") {
    try {
      session = await stripe.checkout.sessions.expire(session.id);
    } catch {
      // It may have been completed in the meantime: check again.
      session = await retrieveSession(session.id);
    }
  }

  if (session?.status === "complete") {
    // Paid after all (the confirmation may still be on its way).
    return (await markOrderPaid(session)) ? "paid" : "pending";
  }

  if (session?.status === "open") {
    // Couldn't close the payment page: leave the order for later.
    return "pending";
  }

  await cancelOrder(orderId);
  return "cancelled";
}

// The user's other unpaid orders, closed before a new one is created so their
// stock isn't held twice.
export async function cancelUserPendingOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) throw error;
  for (const { id } of data) await cancelUnpaidOrder(id, userId);
}

// Safety net for missed Stripe notifications: unpaid orders older than their
// payment page are settled from Stripe's own record (paid or cancelled).
export async function reconcileStaleOrders() {
  const cutoff = new Date(Date.now() - (CHECKOUT_LIFETIME_SECONDS + 5 * 60) * 1000).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (error) throw error;

  for (const { id } of data) {
    try {
      const status = await cancelUnpaidOrder(id);
      console.log(`Reconciled unpaid order ${id}: ${status}`);
    } catch (err: any) {
      console.error(`Couldn't reconcile order ${id}:`, err.message);
    }
  }
}
