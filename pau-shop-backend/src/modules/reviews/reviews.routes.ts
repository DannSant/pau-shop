import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  listReviewsHandler,
  upsertReviewHandler,
  deleteReviewHandler
} from "./reviews.controller";

const router = Router({ mergeParams: true });

router.get("/", listReviewsHandler);
router.post("/", requireAuth, upsertReviewHandler);
router.put("/", requireAuth, upsertReviewHandler);
router.delete("/", requireAuth, deleteReviewHandler);

export default router;
