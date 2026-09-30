import { createProfile, getMe } from "../../api/users";

interface SupabaseLikeUser {
  id: string;
  user_metadata?: {
    name?: string;
    phone?: string;
  };
}

// Users already checked in this tab, so repeated auth events don't re-hit the API.
const checkedUserIds = new Set<string>();

export async function ensureUserProfile(user: SupabaseLikeUser) {
  const name = user.user_metadata?.name;
  const phone = user.user_metadata?.phone;

  if (!phone || checkedUserIds.has(user.id)) return;
  checkedUserIds.add(user.id);

  try {
    await getMe();
  } catch {
    try {
      await createProfile({ name: name ?? "", phone });
    } catch (err) {
      checkedUserIds.delete(user.id);
      console.error("Failed to create user profile", err);
    }
  }
}
