import { Request, Response } from "express";
import { failure, success } from "../../utils/response";
import { POSTAL_CODE_PATTERN } from "../addresses/mexico";
import { findPostalCode } from "./postal-codes.service";

export async function getPostalCodeHandler(req: Request, res: Response) {
  const code = String(req.params.code);
  if (!POSTAL_CODE_PATTERN.test(code)) return failure(res, "postal_code must be 5 digits", 400);

  try {
    const info = await findPostalCode(code);
    if (!info) return failure(res, "Postal code not found", 404);
    return success(res, info);
  } catch {
    return failure(res, "Failed to look up postal code", 500);
  }
}
