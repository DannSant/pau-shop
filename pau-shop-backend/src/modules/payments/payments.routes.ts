import { Router } from "express";
import { cancelCheckoutHandler, createCheckoutSessionHandler } from "./payments.controller";
import { requireAuth } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/create-checkout-session",
  requireAuth,
  createCheckoutSessionHandler
);

// Customer came back from Stripe without paying: release the order's stock.
router.post("/cancel", requireAuth, cancelCheckoutHandler);

export default router;
