export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  created_at: string;
}

export interface CreateUserProfileDTO {
  name: string;
  phone?: string;
}
