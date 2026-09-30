import { getMe } from "../../api/users";

// Users already checked in this tab, so repeated auth events don't re-hit the API.
const checkedUserIds = new Set<string>();

// GET /users/me creates the user_data row from the sign-up metadata if it's
// missing, so calling it once after sign-in is enough.
export async function ensureUserProfile(user: { id: string }) {
  if (checkedUserIds.has(user.id)) return;
  checkedUserIds.add(user.id);

  try {
    await getMe();
  } catch (err) {
    checkedUserIds.delete(user.id);
    console.error("Failed to load user profile", err);
  }
}
