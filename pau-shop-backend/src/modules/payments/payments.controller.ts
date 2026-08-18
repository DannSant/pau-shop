import { Request, Response } from "express";
import { createCheckoutSession } from "./payments.service";
import { success, failure } from "../../utils/response";

export async function createCheckoutSessionHandler(
  req: Request,
  res: Response
) {
  try {

    const { order_id } = req.body;
    const userId = (req as any).user.id;

    const session = await createCheckoutSession(order_id, userId);

    return success(res, session);

  } catch (err: any) {
    console.log(err)
    return failure(res, err.message);
  }
}