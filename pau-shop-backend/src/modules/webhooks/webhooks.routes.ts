import express from "express";
import { stripeWebhookHandler } from "./webhooks.controller";

const router = express.Router();

router.post("/stripe", stripeWebhookHandler);

export default router;