import { stripe } from "../../lib/stripe";
import { supabase } from "../../config/supabase";

export async function createCheckoutSession(orderId: string, userId: string) {

  // Fetch order
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      total,
      order_items (
        quantity,
        price,
        products (
          name
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  // Build Stripe line items
  const line_items = order.order_items.map((item: any) => ({
    price_data: {
      currency: "mxn",
      product_data: {
        name: item.products.name
      },
      unit_amount: Math.round(item.price * 100)
    },
    quantity: item.quantity
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    line_items,

    mode: "payment",

    success_url: `${process.env.FRONTEND_URL}/order-success`,
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