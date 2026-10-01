import { Request, Response } from "express";
import {
  getAllProducts,
  getAdminProducts,
  getAdminProduct,
  createProduct,
  updateProduct,
  setProductDeleted
} from "./products.service";
import { failure, success } from "../../utils/response";
import { cleanLocalizedText, isLocalizedText } from "../../utils/localized";
import { ProductInput } from "./products.types";

type ParseResult =
  | { data: Partial<ProductInput>; error?: undefined }
  | { data?: undefined; error: string };

// Copies only the known fields from the body, validating each one.
// On create every field is set (required ones must be present); on update
// only the fields that were sent are changed.
function parseProductInput(body: any, isCreate: boolean): ParseResult {
  const data: Partial<ProductInput> = {};
  const sent = (key: string) => body?.[key] !== undefined;

  if (isCreate || sent("name")) {
    if (!isLocalizedText(body?.name)) return { error: "name.es is required" };
    data.name = cleanLocalizedText(body.name);
  }

  if (isCreate || sent("description")) {
    const description = body?.description ?? null;
    if (description !== null && !isLocalizedText(description)) {
      return { error: "description must be null or include a non-empty 'es'" };
    }
    data.description = description === null ? null : cleanLocalizedText(description);
  }

  if (isCreate || sent("price")) {
    if (typeof body?.price !== "number" || !(body.price > 0)) {
      return { error: "price must be a positive number" };
    }
    data.price = body.price;
  }

  if (isCreate || sent("offer_price")) {
    const offer = body?.offer_price ?? null;
    if (offer !== null && (typeof offer !== "number" || !(offer > 0))) {
      return { error: "offer_price must be null or a positive number" };
    }
    if (offer !== null && data.price !== undefined && offer >= data.price) {
      return { error: "offer_price must be lower than price" };
    }
    data.offer_price = offer;
  }

  if (isCreate || sent("stock")) {
    if (!Number.isInteger(body?.stock) || body.stock < 0) {
      return { error: "stock must be a whole number of 0 or more" };
    }
    data.stock = body.stock;
  }

  if (isCreate || sent("category_id")) {
    const categoryId = body?.category_id ?? null;
    if (categoryId !== null && typeof categoryId !== "string") {
      return { error: "category_id must be a string or null" };
    }
    data.category_id = categoryId;
  }

  if (isCreate || sent("franchise")) {
    const franchise = typeof body?.franchise === "string" ? body.franchise.trim() : "";
    data.franchise = franchise || null;
  }

  return { data };
}

export async function listProducts(_req: Request, res: Response) {
  try {
    const products = await getAllProducts();
    return success(res,products);
  } catch (err) {
    return failure(res,"Failed to fetch products",500)
  }
}

export async function listAdminProductsHandler(req: Request, res: Response) {
  try {
    const products = await getAdminProducts(req.query.deleted === "true");
    return success(res, products);
  } catch {
    return failure(res, "Failed to fetch products", 500);
  }
}

export async function getAdminProductHandler(req: Request, res: Response) {
  try {
    const product = await getAdminProduct(req.params.id);
    if (!product) return failure(res, "Product not found", 404);
    return success(res, product);
  } catch {
    return failure(res, "Failed to fetch product", 500);
  }
}

export async function createProductHandler(req: Request, res: Response) {
  const parsed = parseProductInput(req.body, true);
  if (parsed.error !== undefined) return failure(res, parsed.error, 400);

  try {
    const product = await createProduct(parsed.data as ProductInput);
    return success(res, product, 201);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
}

export async function updateProductHandler(req: Request, res: Response) {
  const parsed = parseProductInput(req.body, false);
  if (parsed.error !== undefined) return failure(res, parsed.error, 400);

  try {
    const product = await updateProduct(req.params.id, parsed.data);
    if (!product) return failure(res, "Product not found", 404);
    return success(res, product);
  } catch (err: any) {
    return failure(res, err.message, 500);
  }
}

export async function deleteProductHandler(req: Request, res: Response) {
  try {
    const product = await setProductDeleted(req.params.id, true);
    if (!product) return failure(res, "Product not found", 404);
    return success(res, product);
  } catch {
    return failure(res, "Failed to delete product", 500);
  }
}

export async function restoreProductHandler(req: Request, res: Response) {
  try {
    const product = await setProductDeleted(req.params.id, false);
    if (!product) return failure(res, "Product not found", 404);
    return success(res, product);
  } catch {
    return failure(res, "Failed to restore product", 500);
  }
}
