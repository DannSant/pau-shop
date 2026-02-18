import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import {
  createProfileHandler,
  getMeHandler,
  getUsersHandler
} from "./users.controller";

const router = Router();

router.post("/profile", requireAuth, createProfileHandler);
router.get("/me", requireAuth, getMeHandler);
router.get("/", requireAuth, requireAdmin, getUsersHandler);

export default router;
