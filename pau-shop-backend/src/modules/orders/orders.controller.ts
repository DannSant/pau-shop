import { Request, Response } from "express";
import {
  calculateOrderTotal,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderDetail,
  getOrderPaymentStatus,
  setShippingStatus
} from "./orders.service";
import { SHIPPING_STATUSES, ShippingStatus } from "./orders.types";
import { getMyProfile } from "../users/users.service";
import { cancelUserPendingOrders, confirmPaymentWithStripe } from "../payments/payments.service";
import { failure, success } from "../../utils/response";

// Mirrors the checks in the create_order database function, so bad requests
// get a clear 400 before reaching the database.
function validateCreateOrder(body: any): string | null {
  if (typeof body?.shipping_address_id !== "string" || !body.shipping_address_id) {
    return "shipping_address_id is required";
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return "Order must contain at least one item";
  }

  const validItems = body.items.every(
    (item: any) =>
      typeof item?.product_id === "string" &&
      item.product_id !== "" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  );

  return validItems ? null : "Each item needs a product_id and a positive whole quantity";
}

export async function createOrderHandler(req: Request, res: Response) {
  const invalid = validateCreateOrder(req.body);
  if (invalid) return failure(res, invalid, 400);

  try {
    const user = (req as any).user;

    // We contact customers by phone about shipping (Google sign-ins start
    // without one until they complete their profile).
    const profile = await getMyProfile(user);
    if (!profile.phone?.trim()) {
      return failure(res, "A phone number is required to place an order", 400);
    }

    // An earlier attempt that wasn't paid (e.g. the customer closed the
    // payment page) is cancelled first, so its stock isn't held twice.
    await cancelUserPendingOrders(user.id);

    const order = await createOrder(user.id, req.body);
    return success(res, order, 201);
  } catch (err: any) {
    // Messages from create_order (e.g. "Insufficient stock") are shown to the
    // customer by the frontend; anything else is a generic failure.
    const message = typeof err?.message === "string" ? err.message : "Failed to create order";
    return failure(res, message);
  }
}

export async function listOrdersHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const orders = await getMyOrders(user.id);
    return success(res, orders);
  } catch {
     return failure(res, "Failed to fetch orders", 500);
  }
}

export async function getOrderDetailHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    let order = await getOrderDetail(user.id, req.params.id);

    // Just back from paying: the webhook may not have arrived yet.
    if (order.status === "pending" && order.stripe_session_id) {
      const paid = await confirmPaymentWithStripe(order.id, order.stripe_session_id).catch(() => false);
      if (paid) order = await getOrderDetail(user.id, req.params.id);
    }

    return success(res,order);
  } catch {
    return failure(res,"Order not found",404)
  }
}

export async function calculateTotalHandler(req: Request, res: Response) {
  try {
    const amount = parseFloat(req.query.amount as string);
    const order = await calculateOrderTotal(amount);
    return success(res,order);
  } catch {
    return failure(res,"Order not found",404)
  }
}

// Admin only. Any of the three values is allowed (so mistakes can be undone),
// but an order can't be shipped before it's paid.
export async function updateShippingStatusHandler(req: Request, res: Response) {
  const shippingStatus = req.body?.shipping_status;

  if (!SHIPPING_STATUSES.includes(shippingStatus)) {
    return failure(res, `shipping_status must be one of: ${SHIPPING_STATUSES.join(", ")}`, 400);
  }

  try {
    const paymentStatus = await getOrderPaymentStatus(req.params.id);

    if (paymentStatus === null) {
      return failure(res, "Order not found", 404);
    }

    if (shippingStatus !== "pending" && paymentStatus !== "paid") {
      return failure(res, "Only paid orders can be shipped", 400);
    }

    const order = await setShippingStatus(req.params.id, shippingStatus as ShippingStatus);
    return success(res, order);
  } catch {
    return failure(res, "Failed to update shipping status", 500);
  }
}

const PAYMENT_STATUSES = ["pending", "paid", "cancelled"];

// Admin only. Optional filters: ?shipping_status=...&payment_status=...
export async function listAllOrdersHandler(req: Request, res: Response) {
  const shippingStatus = req.query.shipping_status as string | undefined;
  const paymentStatus = req.query.payment_status as string | undefined;

  if (shippingStatus && !SHIPPING_STATUSES.includes(shippingStatus as ShippingStatus)) {
    return failure(res, "Invalid shipping_status filter", 400);
  }
  if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) {
    return failure(res, "Invalid payment_status filter", 400);
  }

  try {
    const orders = await getAllOrders({ shippingStatus, paymentStatus });
    return success(res, orders);
  } catch {
    return failure(res, "Failed to fetch orders", 500);
  }
}
