import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  listProducts,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler
} from "./products.controller";
import { requireAdmin } from "../../middlewares/admin.middleware";

const router = Router();

router.get("/", listProducts);
router.post("/", requireAuth, requireAdmin, createProductHandler);
router.put("/:id", requireAuth, requireAdmin, updateProductHandler);
router.delete("/:id", requireAuth, requireAdmin, deleteProductHandler);

export default router;
