import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/admin.middleware";
import {
  addImageHandler,
  deleteImageHandler,
  listImagesHandler,
  parseImageUpload,
  setThumbnailHandler
} from "./product-images.controller";

const router = Router({ mergeParams: true });

router.get("/", listImagesHandler);

// multipart/form-data with one or more "images" files
router.post("/", requireAuth, requireAdmin, parseImageUpload, addImageHandler);

router.delete(
  "/:imageId",
  requireAuth,
  requireAdmin,
  deleteImageHandler
);

router.patch(
  "/:imageId",
  requireAuth,
  requireAdmin,
  setThumbnailHandler
);

export default router;