import { Request, Response } from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "./products.service";
import { failure, success } from "../../utils/response";
import { isLocalizedText } from "../../utils/localized";

// name is required on create; description may be omitted or null.
function validateProductText(body: any, isCreate: boolean): string | null {
  if ((isCreate || body.name !== undefined) && !isLocalizedText(body.name)) {
    return "name must be an object of strings with a non-empty 'es' value";
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    !isLocalizedText(body.description)
  ) {
    return "description must be null or an object of strings with a non-empty 'es' value";
  }

  return null;
}

export async function listProducts(_req: Request, res: Response) {
  try {
    //console.log('Getting products')
    const products = await getAllProducts();
    //console.log(products)
    return success(res,products);
  } catch (err) {
    return failure(res,"Failed to fetch products",500)
  }
}

export async function createProductHandler(req: Request, res: Response) {
  const invalid = validateProductText(req.body, true);
  if (invalid) return failure(res, invalid, 400);

  try {
    const product = await createProduct(req.body);
    return success(res,product);
  } catch (err: any) {
    return failure(res,err.message,500);
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  const invalid = validateProductText(req.body, false);
  if (invalid) return failure(res, invalid, 400);

  try {
    const product = await updateProduct(req.params.id, req.body);
    return success(res,product);
  } catch (err: any) {
    return failure(res,err.message,500)
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    await deleteProduct(req.params.id);
    return success(res,{})
  } catch {
    return failure(res,"Failed to delete product",500);
  }
}
