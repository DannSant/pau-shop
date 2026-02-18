import { supabase } from "../../config/supabase";
import { CreateUserProfileDTO } from "./users.types";

export async function createUserProfile(
  userId: string,
  email: string,
  input: CreateUserProfileDTO
) {
  const { data, error } = await supabase
    .from("user_data")
    .insert({
      id: userId,
      email,
      name: input.name,
      phone: input.phone
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
