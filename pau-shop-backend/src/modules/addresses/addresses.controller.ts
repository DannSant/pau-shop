import { Request, Response } from "express";
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from "./addresses.service";
import { failure, success } from "../../utils/response";
import { CreateAddressDTO } from "./addresses.types";

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "street",
  "exterior_number",
  "neighborhood",
  "city",
  "state",
  "postal_code"
] as const;

const MAX_LENGTH = 200;
const PHONE_PATTERN = /^[0-9+\-() ]{7,20}$/;

// Copies only the address fields from the body (never user_id or id).
// On create every required field must be filled; on update only the fields
// sent are checked and changed.
function parseAddressInput(body: any, isCreate: boolean): { data: Partial<CreateAddressDTO> } | { error: string } {
  const data: Partial<CreateAddressDTO> = {};

  for (const field of REQUIRED_FIELDS) {
    const value = body?.[field];
    if (value === undefined && !isCreate) continue;
    if (typeof value !== "string" || !value.trim()) return { error: `${field} is required` };
    if (value.trim().length > MAX_LENGTH) return { error: `${field} is too long` };
    data[field] = value.trim();
  }

  if (data.phone !== undefined && !PHONE_PATTERN.test(data.phone)) {
    return { error: "Invalid phone number" };
  }

  if (body?.interior_number !== undefined) {
    const interior = body.interior_number;
    if (interior !== null && typeof interior !== "string") return { error: "interior_number must be text" };
    data.interior_number = interior?.trim() || undefined;
    if ((data.interior_number?.length ?? 0) > MAX_LENGTH) return { error: "interior_number is too long" };
  }

  return { data };
}

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
  const parsed = parseAddressInput(req.body, true);
  if ("error" in parsed) return failure(res, parsed.error, 400);

  try {
    const user = (req as any).user;
    const address = await createAddress(user.id, parsed.data as CreateAddressDTO);
    return success(res, address, 201);
  } catch {
    return failure(res, "Failed to create address", 500);
  }
}

export async function updateAddressHandler(req: Request, res: Response) {
  const parsed = parseAddressInput(req.body, false);
  if ("error" in parsed) return failure(res, parsed.error, 400);

  try {
    const user = (req as any).user;
    const address = await updateAddress(user.id, req.params.id, parsed.data);
    if (!address) return failure(res, "Address not found", 404);
    return success(res,address);
  } catch {
    return failure(res,"Failed to update address",500)
  }
}

export async function deleteAddressHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const deleted = await deleteAddress(user.id, req.params.id);
    if (!deleted) return failure(res, "Address not found", 404);
    return success(res,{})
  } catch (err: any) {
    // Orders keep pointing at the address they were shipped to.
    if (err?.code === "23503") return failure(res, "This address is used by an order", 409);
    return failure(res,"Failed to delete address",500);
  }
}
