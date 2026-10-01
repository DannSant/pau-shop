import { Request, Response } from "express";
import { failure, success } from "../../utils/response";
import { cleanLocalizedText, isLocalizedText, LocalizedText } from "../../utils/localized";
import { createCategory, listCategories, slugify, updateCategory } from "./categories.service";

export async function listCategoriesHandler(_req: Request, res: Response) {
  try {
    return success(res, await listCategories());
  } catch {
    return failure(res, "Failed to fetch categories", 500);
  }
}

export async function createCategoryHandler(req: Request, res: Response) {
  if (!isLocalizedText(req.body?.name) || slugify(req.body.name.es) === "") {
    return failure(res, "name.es is required", 400);
  }

  const sortOrder = req.body?.sort_order ?? 0;
  if (!Number.isInteger(sortOrder)) {
    return failure(res, "sort_order must be a whole number", 400);
  }

  try {
    const category = await createCategory({
      name: cleanLocalizedText(req.body.name),
      sort_order: sortOrder
    });
    return success(res, category, 201);
  } catch (err: any) {
    if (err?.code === "23505") return failure(res, "A category with this name already exists", 409);
    return failure(res, "Failed to create category", 500);
  }
}

export async function updateCategoryHandler(req: Request, res: Response) {
  const input: { name?: LocalizedText; sort_order?: number } = {};

  if (req.body?.name !== undefined) {
    if (!isLocalizedText(req.body.name)) return failure(res, "name.es is required", 400);
    input.name = cleanLocalizedText(req.body.name);
  }

  if (req.body?.sort_order !== undefined) {
    if (!Number.isInteger(req.body.sort_order)) {
      return failure(res, "sort_order must be a whole number", 400);
    }
    input.sort_order = req.body.sort_order;
  }

  try {
    const category = await updateCategory(req.params.id, input);
    if (!category) return failure(res, "Category not found", 404);
    return success(res, category);
  } catch {
    return failure(res, "Failed to update category", 500);
  }
}
