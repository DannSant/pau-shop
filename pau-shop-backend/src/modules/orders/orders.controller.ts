import { Request, Response } from "express";
import {
  calculateOrderTotal,
  createOrder,
  getMyOrders,
  getOrderDetail
} from "./orders.service";
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
    const order = await createOrder(user.id, req.body);
    return success(res, order, 201);
  } catch (err: any) {
    return failure(res, err.message);
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
    const order = await getOrderDetail(user.id, req.params.id);
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
