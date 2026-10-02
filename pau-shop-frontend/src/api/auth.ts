
import { supabase } from "./supabase";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}


export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
};

export const signup = async (
  email: string,
  password: string,
  name: string,
  phone: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  if (error) throw error;

  return data;
};

// Sends the browser to Google. New Google accounts are created automatically
// and existing ones are just signed in, so sign-up and login use the same call.
// Supabase brings the user back to /login, where GuestRoute takes over.
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/login` },
  });

  if (error) throw error;
};
