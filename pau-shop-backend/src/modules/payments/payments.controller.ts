import { Request, Response } from "express";
import { cancelUnpaidOrder, createCheckoutSession, PaymentError } from "./payments.service";
import { success, failure } from "../../utils/response";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readOrderId(body: any) {
  const orderId = body?.order_id;
  return typeof orderId === "string" && UUID.test(orderId) ? orderId : null;
}

export async function createCheckoutSessionHandler(req: Request, res: Response) {
  const orderId = readOrderId(req.body);
  if (!orderId) return failure(res, "Order not found", 404);

  try {
    const userId = (req as any).user.id;
    const language = req.body?.language === "en" ? "en" : "es";
    return success(res, await createCheckoutSession(orderId, userId, language));
  } catch (err: any) {
    if (err instanceof PaymentError) return failure(res, err.message, err.status);
    console.error("Checkout session failed:", err);
    return failure(res, "Failed to start payment", 500);
  }
}

// The customer came back from Stripe without paying.
export async function cancelCheckoutHandler(req: Request, res: Response) {
  const orderId = readOrderId(req.body);
  if (!orderId) return failure(res, "Order not found", 404);

  try {
    const status = await cancelUnpaidOrder(orderId, (req as any).user.id);
    return success(res, { status });
  } catch (err: any) {
    if (err instanceof PaymentError) return failure(res, err.message, err.status);
    console.error("Cancel checkout failed:", err);
    return failure(res, "Failed to cancel payment", 500);
  }
}
