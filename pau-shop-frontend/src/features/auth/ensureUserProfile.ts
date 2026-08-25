import { createProfile, getMe } from "../../api/users";

interface SupabaseLikeUser {
  user_metadata?: {
    name?: string;
    phone?: string;
  };
}

export async function ensureUserProfile(user: SupabaseLikeUser) {
  const name = user.user_metadata?.name;
  const phone = user.user_metadata?.phone;

  if (!phone) return;

  try {
    await getMe();
  } catch {
    try {
      await createProfile({ name: name ?? "", phone });
    } catch (err) {
      console.error("Failed to create user profile", err);
    }
  }
}
