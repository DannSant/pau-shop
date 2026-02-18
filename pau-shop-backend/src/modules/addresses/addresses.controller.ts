import { Request, Response } from "express";
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from "./addresses.service";
import { failure, success } from "../../utils/response";

export async function listMyAddresses(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const addresses = await getMyAddresses(user.id);
    return success(res,addresses);
  } catch {
    return failure(res,"Failed to fetch addresses",500)
  }
}

export async function createAddressHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const address = await createAddress(user.id, req.body);
    return success(res,address);
  } catch (err: any) {
    return failure(res,err.message,400)
  }
}

export async function updateAddressHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const address = await updateAddress(
      user.id,
      req.params.id,
      req.body
    );
    return success(res,address);
  } catch {
    return failure(res,"Failed to update address",500)
  }
}

export async function deleteAddressHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    await deleteAddress(user.id, req.params.id);
    return success(res,{})
  } catch {
    return failure(res,"Failed to delete address",500);
  }
}
