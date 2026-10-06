import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { getPostalCodeHandler } from "./postal-codes.controller";

const router = Router();

// Only the address form uses it, which needs a signed-in user anyway.
router.get("/:code", requireAuth, getPostalCodeHandler);

export default router;
