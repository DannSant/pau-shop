import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  const { data, error } = await supabase
    .from("user_data")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || data?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
