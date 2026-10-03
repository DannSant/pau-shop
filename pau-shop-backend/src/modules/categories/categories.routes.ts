import { requireUuidParam } from "../../utils/ids";
import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import {
  createCategoryHandler,
  listCategoriesHandler,
  updateCategoryHandler
} from "./categories.controller";

const router = Router();
router.param("id", requireUuidParam);

router.get("/", listCategoriesHandler);
router.post("/", requireAuth, requireAdmin, createCategoryHandler);
router.put("/:id", requireAuth, requireAdmin, updateCategoryHandler);

export default router;
