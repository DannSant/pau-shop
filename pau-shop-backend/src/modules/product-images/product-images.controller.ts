import { Request, Response } from "express";
import { success, failure } from "../../utils/response";
import {
  addProductImage,
  deleteProductImage,
  listProductImages,
  setThumbnail
} from "./product-images.service";

export async function addImageHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;    
    const image = await addProductImage(id, req.body);
    return success(res, image, 201);
  } catch (err: any) {
    return failure(res, err.message);
  }
}

export async function deleteImageHandler(req: Request, res: Response) {
  try {
    const { imageId } = req.params;
    await deleteProductImage(imageId);
    return success(res, true);
  } catch (err: any) {
    return failure(res, err.message);
  }
}

export async function setThumbnailHandler(req: Request, res: Response) {
  try {
    const { id, imageId } = req.params;
    const image = await setThumbnail(id, imageId);
    return success(res, image);
  } catch (err: any) {
    return failure(res, err.message);
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