import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderDetailHandler
} from "./orders.controller";

const router = Router();

router.use(requireAuth);

router.post("/", createOrderHandler);
router.get("/", listOrdersHandler);
router.get("/:id", getOrderDetailHandler);

export default router;
