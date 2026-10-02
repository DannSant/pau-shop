import { Request, Response } from "express";
import {
  deleteReview,
  getOwnReview,
  getProductReviews,
  hasReceivedProduct,
  productIsAvailable,
  saveReview
} from "./reviews.service";
import { getMyProfile } from "../users/users.service";
import { isBannedFromReviews } from "../moderation/moderation.service";
import { failure, success } from "../../utils/response";
import { MAX_COMMENT_LENGTH, ReviewInput } from "./reviews.types";

function parseReviewInput(body: any): { data: ReviewInput } | { error: string } {
  const score = body?.score;
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { error: "score must be a whole number from 1 to 5" };
  }

  const rawComment = body?.comment ?? null;
  if (rawComment !== null && typeof rawComment !== "string") {
    return { error: "comment must be text" };
  }

  const comment = rawComment?.trim() || null;
  if (comment && comment.length > MAX_COMMENT_LENGTH) {
    return { error: `comment must be ${MAX_COMMENT_LENGTH} characters or fewer` };
  }

  return { data: { score, comment } };
}

// Public: summary plus every review, newest first.
export async function listReviewsHandler(req: Request, res: Response) {
  try {
    return success(res, await getProductReviews(req.params.id));
  } catch {
    return failure(res, "Failed to fetch reviews", 500);
  }
}

// Signed in: whether the user may review this product, and their review if any.
// "banned" users (blocked by an admin) can't write or edit reviews.
export async function myReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const [review, canReview, banned] = await Promise.all([
      getOwnReview(user.id, req.params.id),
      hasReceivedProduct(user.id, req.params.id),
      isBannedFromReviews(user.id)
    ]);
    return success(res, { canReview, banned, review });
  } catch {
    return failure(res, "Failed to fetch your review", 500);
  }
}

export async function saveReviewHandler(req: Request, res: Response) {
  const parsed = parseReviewInput(req.body);
  if ("error" in parsed) return failure(res, parsed.error, 400);

  try {
    const user = (req as any).user;

    if (!(await productIsAvailable(req.params.id))) {
      return failure(res, "Product not found", 404);
    }

    if (await isBannedFromReviews(user.id)) {
      return failure(res, "You can no longer post reviews", 403);
    }

    if (!(await hasReceivedProduct(user.id, req.params.id))) {
      return failure(res, "You can only review products you have received", 403);
    }

    // Reviews reference user_data, so make sure the profile exists.
    await getMyProfile(user);

    const { review, created } = await saveReview(user.id, req.params.id, parsed.data);
    return success(res, review, created ? 201 : 200);
  } catch {
    return failure(res, "Failed to save review", 500);
  }
}

export async function deleteReviewHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const deleted = await deleteReview(user.id, req.params.id);
    if (!deleted) return failure(res, "Review not found", 404);
    return success(res, {});
  } catch {
    return failure(res, "Failed to delete review", 500);
  }
}
