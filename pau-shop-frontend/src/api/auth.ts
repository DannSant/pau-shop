
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