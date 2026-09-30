import type { User } from "@supabase/supabase-js";
import { supabase } from "../../config/supabase";
import { NewUserProfile, UpdateUserProfileDTO } from "./users.types";

export async function createUserProfile(
  userId: string,
  email: string,
  input: NewUserProfile
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

  // Already created (e.g. two tabs provisioning at once): return the existing
  // row unchanged so the endpoint is idempotent.
  if (error?.code === "23505") {
    const existing = await findProfile(userId);
    if (existing) return existing;
  }

  if (error) throw error;
  return data;
}

async function findProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_data")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Returns the user's profile, creating it from the sign-up metadata if the
// row doesn't exist yet.
export async function getMyProfile(authUser: User) {
  const existing = await findProfile(authUser.id);
  if (existing) return existing;

  const email = authUser.email ?? "";
  const metadata = authUser.user_metadata ?? {};

  return createUserProfile(authUser.id, email, {
    name: metadata.name || email.split("@")[0],
    phone: metadata.phone || null
  });
}

export async function updateMyProfile(
  userId: string,
  input: UpdateUserProfileDTO
) {
  const { data, error } = await supabase
    .from("user_data")
    .update({ name: input.name, phone: input.phone })
    .eq("id", userId)
    .select()
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
