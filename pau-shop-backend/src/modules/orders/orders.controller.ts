import { Request, Response } from "express";
import {
  calculateOrderTotal,
  createOrder,
  getMyOrders,
  getOrderDetail
} from "./orders.service";
import { failure, success } from "../../utils/response";

export async function createOrderHandler(req: Request, res: Response) {
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
