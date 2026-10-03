import { requireUuidParam } from "../../utils/ids";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import {
  listProducts,
  listAdminProductsHandler,
  getAdminProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  restoreProductHandler
} from "./products.controller";
import { requireAdmin } from "../../middlewares/admin.middleware";

const router = Router();
router.param("id", requireUuidParam);

router.get("/", listProducts);

// Admin only (the admin listing includes deleted products)
router.get("/admin", requireAuth, requireAdmin, listAdminProductsHandler);
router.get("/admin/:id", requireAuth, requireAdmin, getAdminProductHandler);
router.post("/", requireAuth, requireAdmin, createProductHandler);
router.put("/:id", requireAuth, requireAdmin, updateProductHandler);
router.delete("/:id", requireAuth, requireAdmin, deleteProductHandler);
router.post("/:id/restore", requireAuth, requireAdmin, restoreProductHandler);

export default router;
