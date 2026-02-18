import { supabase } from "../../config/supabase";
import { CreateAddressDTO, UpdateAddressDTO } from "./addresses.types";

export async function getMyAddresses(userId: string) {
  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createAddress(
  userId: string,
  input: CreateAddressDTO
) {
  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert({
      user_id: userId,
      ...input
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAddress(
  userId: string | string[],
  addressId: string | string[],
  input: UpdateAddressDTO
) {
  const { data, error } = await supabase
    .from("shipping_addresses")
    .update(input)
    .eq("id", addressId)
    .eq("user_id", userId) // ownership check
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAddress(
  userId: string | string[],
  addressId: string | string[]
) {
  const { error } = await supabase
    .from("shipping_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId); // ownership check

  if (error) throw error;
}
