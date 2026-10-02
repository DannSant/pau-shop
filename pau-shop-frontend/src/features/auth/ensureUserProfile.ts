import { getMe } from "../../api/users";
import type { UserProfile } from "../../types/user";

// One request per user per tab, so repeated auth events don't re-hit the API.
const profiles = new Map<string, Promise<UserProfile | null>>();

// GET /users/me creates the user_data row from the sign-up metadata if it's
// missing, and returns the profile (including the role).
export function ensureUserProfile(user: { id: string }): Promise<UserProfile | null> {
  let profile = profiles.get(user.id);

  if (!profile) {
    profile = getMe().catch((err) => {
      profiles.delete(user.id);
      console.error("Failed to load user profile", err);
      return null;
    });
    profiles.set(user.id, profile);
  }

  return profile;
}

// Replaces the cached profile after it's been saved, so a later auth event in
// this tab doesn't bring back the old values (e.g. "no phone").
export function rememberProfile(profile: UserProfile) {
  profiles.set(profile.id, Promise.resolve(profile));
}
