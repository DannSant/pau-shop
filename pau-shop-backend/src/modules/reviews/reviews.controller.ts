import { Request, Response } from "express";
import {
  getProductReviews,
  upsertReview,
  deleteReview
} from "./reviews.service";
import { failure, success } from "../../utils/response";

export async function listReviewsHandler(req: Request, res: Response) {
  try {
    const reviews = await getProductReviews(req.params.id);
    return success(res,reviews);
  } catch (err: any) {   
    return failure(res,"Failed to fetch reviews",500);
  }
}

export async function upsertReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const review = await upsertReview(
      user.id,
      req.params.id,
      req.body
    );

    return success(res,review);
  } catch (err: any) {
    return failure(res,err.message,500);
  }
}

export async function deleteReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    await deleteReview(user.id, req.params.id);
    return success(res,{});
  } catch {
    return failure(res,"Failed to delete review",500)
  }
}
