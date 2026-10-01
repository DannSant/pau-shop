import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  deleteReviewHandler,
  listReviewsHandler,
  myReviewHandler,
  saveReviewHandler
} from "./reviews.controller";

const router = Router({ mergeParams: true });

router.get("/", listReviewsHandler);
router.get("/me", requireAuth, myReviewHandler);
// POST and PUT both create the review or replace the user's existing one.
router.post("/", requireAuth, saveReviewHandler);
router.put("/", requireAuth, saveReviewHandler);
router.delete("/", requireAuth, deleteReviewHandler);

export default router;
