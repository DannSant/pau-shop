import { Request, Response } from "express";
import { failure, success } from "../../utils/response";
import {
  banUser,
  deleteAllUserReviews,
  deleteReviewsAsAdmin,
  getUserModerationDetail,
  getUserSummary,
  listRecentReviews,
  listUsers,
  unbanUser
} from "./moderation.service";
import { MAX_BAN_NOTE_LENGTH } from "./moderation.types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readOffset(value: unknown) {
  const offset = Number(value ?? 0);
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
}

export async function listReviewsHandler(req: Request, res: Response) {
  try {
    return success(res, await listRecentReviews(readOffset(req.query.offset)));
  } catch {
    return failure(res, "Failed to fetch reviews", 500);
  }
}

export async function deleteReviewHandler(req: Request, res: Response) {
  const reviewId = String(req.params.reviewId);
  if (!UUID.test(reviewId)) return failure(res, "Review not found", 404);

  try {
    const deleted = await deleteReviewsAsAdmin([reviewId], (req as any).user.id);
    if (deleted === 0) return failure(res, "Review not found", 404);
    return success(res, { deleted });
  } catch {
    return failure(res, "Failed to delete review", 500);
  }
}

export async function listUsersHandler(req: Request, res: Response) {
  const search = typeof req.query.search === "string" ? req.query.search.slice(0, 100) : "";

  try {
    return success(res, await listUsers(search, readOffset(req.query.offset)));
  } catch {
    return failure(res, "Failed to fetch users", 500);
  }
}

export async function getUserHandler(req: Request, res: Response) {
  const userId = String(req.params.userId);
  if (!UUID.test(userId)) return failure(res, "User not found", 404);

  try {
    const detail = await getUserModerationDetail(userId);
    if (!detail) return failure(res, "User not found", 404);
    return success(res, detail);
  } catch {
    return failure(res, "Failed to fetch user", 500);
  }
}

export async function deleteUserReviewsHandler(req: Request, res: Response) {
  const userId = String(req.params.userId);
  if (!UUID.test(userId)) return failure(res, "User not found", 404);

  try {
    if (!(await getUserSummary(userId))) return failure(res, "User not found", 404);
    const deleted = await deleteAllUserReviews(userId, (req as any).user.id);
    return success(res, { deleted });
  } catch {
    return failure(res, "Failed to delete reviews", 500);
  }
}

export async function banUserHandler(req: Request, res: Response) {
  const userId = String(req.params.userId);
  if (!UUID.test(userId)) return failure(res, "User not found", 404);

  const rawNote = req.body?.note ?? null;
  if (rawNote !== null && typeof rawNote !== "string") {
    return failure(res, "note must be text", 400);
  }
  const note = rawNote?.trim() || null;
  if (note && note.length > MAX_BAN_NOTE_LENGTH) {
    return failure(res, `note must be ${MAX_BAN_NOTE_LENGTH} characters or fewer`, 400);
  }

  const adminId = (req as any).user.id;
  if (userId === adminId) return failure(res, "You can't ban yourself", 400);

  try {
    const user = await getUserSummary(userId);
    if (!user) return failure(res, "User not found", 404);
    if (user.role === "admin") return failure(res, "Admins can't be banned", 400);

    await banUser(userId, adminId, note);
    return success(res, await getUserSummary(userId));
  } catch {
    return failure(res, "Failed to ban user", 500);
  }
}

export async function unbanUserHandler(req: Request, res: Response) {
  const userId = String(req.params.userId);
  if (!UUID.test(userId)) return failure(res, "User not found", 404);

  try {
    if (!(await getUserSummary(userId))) return failure(res, "User not found", 404);
    await unbanUser(userId);
    return success(res, await getUserSummary(userId));
  } catch {
    return failure(res, "Failed to unban user", 500);
  }
}
