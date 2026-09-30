import { Request, Response } from "express";
import {
  createUserProfile,
  getMyProfile,
  getAllUsers,
  updateMyProfile
} from "./users.service";
import { failure, success } from "../../utils/response";

export async function createProfileHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!req.body.phone) {
      return failure(res, "Phone is required", 400);
    }

    const profile = await createUserProfile(
      user.id,
      user.email,
      req.body
    );

    return success(res,profile);
  } catch (err: any) {
    return failure(res,err.message);
  }
}

export async function getMeHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const profile = await getMyProfile(user);
    return success(res,profile);
  } catch {
    return failure(res,"Failed to load profile",500);
  }
}

const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/;

export async function updateMeHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (!name) {
      return failure(res, "Name is required", 400);
    }

    if (!PHONE_PATTERN.test(phone)) {
      return failure(res, "Invalid phone number", 400);
    }

    const profile = await updateMyProfile(user.id, { name, phone });
    return success(res, profile);
  } catch {
    return failure(res, "Failed to update profile", 500);
  }
}

export async function getUsersHandler(_req: Request, res: Response) {
  try {
    const users = await getAllUsers();
    return success(res,users);
  } catch {
    return failure(res,"Failed to fetch users",500)
  }
}
