import { Response } from "express";

export function success<T>(
  res: Response,
  data: T,
  statusCode = 200
) {
  return res.status(statusCode).json({
    data,
    error: null
  });
}

export function failure(
  res: Response,
  message: string,
  statusCode = 400
) {
  return res.status(statusCode).json({
    data: null,
    error: message
  });
}
