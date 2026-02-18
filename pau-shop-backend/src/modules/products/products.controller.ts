import { Request, Response } from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "./products.service";
import { failure, success } from "../../utils/response";

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
  try {
    const product = await createProduct(req.body);
    return success(res,product);
  } catch (err: any) {
    return failure(res,err.message,500);
  }
}

export async function updateProductHandler(req: Request, res: Response) {
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
