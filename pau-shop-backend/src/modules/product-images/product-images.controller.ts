import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { success, failure } from "../../utils/response";
import {
  IMAGE_TYPES,
  deleteProductImage,
  listProductImages,
  setThumbnail,
  uploadProductImages
} from "./product-images.service";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 10;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES[file.mimetype]) return cb(null, true);
    cb(new Error("Only JPG, PNG, WEBP, GIF or AVIF images are allowed"));
  }
});

// Parses the "images" files of a multipart request, answering 400 on bad files.
export function parseImageUpload(req: Request, res: Response, next: NextFunction) {
  upload.array("images", MAX_FILES)(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `Each image must be ${MAX_FILE_SIZE_MB} MB or smaller`
          : err.code === "LIMIT_FILE_COUNT"
            ? `Upload at most ${MAX_FILES} images at a time`
            : err.message;
      return failure(res, message, 400);
    }

    return failure(res, (err as Error).message, 400);
  });
}

export async function addImageHandler(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) return failure(res, "No images were sent", 400);

  try {
    const images = await uploadProductImages(req.params.id as string, files);
    if (!images) return failure(res, "Product not found", 404);
    return success(res, images, 201);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
}

export async function deleteImageHandler(req: Request, res: Response) {
  try {
    const { id, imageId } = req.params;
    const deleted = await deleteProductImage(id, imageId);
    if (!deleted) return failure(res, "Image not found", 404);
    return success(res, true);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
}

export async function setThumbnailHandler(req: Request, res: Response) {
  try {
    const { id, imageId } = req.params;
    const image = await setThumbnail(id, imageId);
    if (!image) return failure(res, "Image not found", 404);
    return success(res, image);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
}

export async function listImagesHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const images = await listProductImages(id);
    return success(res, images);
  } catch (err: any) {
    return failure(res, err.message);
  }
}
