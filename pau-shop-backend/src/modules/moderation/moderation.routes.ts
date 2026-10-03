import { requireUuidParam } from "../../utils/ids";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import {
  banUserHandler,
  deleteReviewHandler,
  deleteUserReviewsHandler,
  getUserHandler,
  listReviewsHandler,
  listUsersHandler,
  unbanUserHandler
} from "./moderation.controller";

// Review moderation, admins only.
const router = Router();
router.param("reviewId", requireUuidParam);
router.param("userId", requireUuidParam);

router.use(requireAuth, requireAdmin);

router.get("/reviews", listReviewsHandler);
router.delete("/reviews/:reviewId", deleteReviewHandler);

router.get("/users", listUsersHandler);
router.get("/users/:userId", getUserHandler);
router.delete("/users/:userId/reviews", deleteUserReviewsHandler);
// PUT bans (or updates the note), DELETE lifts the ban.
router.put("/users/:userId/ban", banUserHandler);
router.delete("/users/:userId/ban", unbanUserHandler);

export default router;
