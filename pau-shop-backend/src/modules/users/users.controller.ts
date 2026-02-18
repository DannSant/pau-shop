import { Request, Response } from "express";
import {
  createUserProfile,
  getMyProfile,
  getAllUsers
} from "./users.service";
import { failure, success } from "../../utils/response";

export async function createProfileHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;

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
    const profile = await getMyProfile(user.id);
    return success(res,profile);
  } catch {
    return failure(res,"Profile not found",500);
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
