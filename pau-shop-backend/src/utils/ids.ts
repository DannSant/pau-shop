import { NextFunction, Request, Response } from "express";
import { failure } from "./response";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

// For router.param(): an id that can't exist answers 404 instead of reaching
// the database (which would fail with a 500).
export function requireUuidParam(_req: Request, res: Response, next: NextFunction, value: string) {
  if (!isUuid(value)) return failure(res, "Not found", 404);
  next();
}
