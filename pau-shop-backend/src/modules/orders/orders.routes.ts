import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import {
  createOrderHandler,
  listOrdersHandler,
  getOrderDetailHandler,
  calculateTotalHandler,
  updateShippingStatusHandler,
  listAllOrdersHandler
} from "./orders.controller";


const router = Router();

router.use(requireAuth);

router.post("/", createOrderHandler);
router.get("/", listOrdersHandler);
// Before "/:id", otherwise "admin" would be read as an order id.
router.get("/admin", requireAdmin, listAllOrdersHandler);
router.get("/:id", getOrderDetailHandler);
router.get("/total/calculate", calculateTotalHandler);
router.patch("/:id/shipping-status", requireAdmin, updateShippingStatusHandler);

export default router;
