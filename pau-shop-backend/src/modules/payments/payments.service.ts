import { stripe } from "../../lib/stripe";
import { supabase } from "../../config/supabase";
import { localize } from "../../utils/localized";

export async function createCheckoutSession(orderId: string, userId: string) {

  // Fetch order
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      total_amount,
      order_items (
        quantity,
        unit_price,
        product_name
      )
    `)
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  // Same response whether the order doesn't exist or belongs to someone else.
  if (error || !order) {
    throw new Error("Order not found");
  }

  // Build Stripe line items from the names saved on the order (what the
  // customer bought), in the default language since Stripe needs a string.
  const line_items = order.order_items.map((item: any) => ({
    price_data: {
      currency: "mxn",
      product_data: {
        name: localize(item.product_name)
      },
      unit_amount: Math.round(item.unit_price * 100)
    },
    quantity: item.quantity
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    line_items,

    mode: "payment",

    success_url: `${process.env.FRONTEND_URL}/order-success?order_id=${orderId}`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout`,

    metadata: {
      order_id: orderId,
      user_id: userId
    }
  });

  // Save session ID
  await supabase
    .from("orders")
    .update({
      stripe_session_id: session.id
    })
    .eq("id", orderId);

  return {
    checkout_url: session.url
  };
}