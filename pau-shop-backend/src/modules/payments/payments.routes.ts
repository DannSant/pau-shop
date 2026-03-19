import { Router } from "express";
import { createCheckoutSessionHandler } from "./payments.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create-checkout-session",
  requireAuth,
  createCheckoutSessionHandler
);

export default router;