export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "admin";
  created_at: string;
}
