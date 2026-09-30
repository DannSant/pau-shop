export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface CreateUserProfileDTO {
  name: string;
  phone: string;
}

// Internal shape for creating a row; phone may be missing when the profile is
// auto-created from sign-up metadata.
export interface NewUserProfile {
  name: string;
  phone: string | null;
}

export interface UpdateUserProfileDTO {
  name: string;
  phone: string;
}
