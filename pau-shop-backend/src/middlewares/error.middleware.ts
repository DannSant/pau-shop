import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  return res.status(500).json({
    data: null,
    error: "Internal server error"
  });
}
