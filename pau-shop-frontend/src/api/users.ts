import { api } from "./axios";
import { request } from "./request";
import type { UserProfile } from "../types/user";

export interface CreateUserProfilePayload {
  name: string;
  phone: string;
}

export interface UpdateUserProfilePayload {
  name: string;
  phone: string;
}

export const createProfile = async (payload: CreateUserProfilePayload) => {
  return request<UserProfile>(api.post("/users/profile", payload));
};

// Creates the profile server-side if it doesn't exist yet.
export const getMe = async () => {
  return request<UserProfile>(api.get("/users/me"));
};

export const updateProfile = async (payload: UpdateUserProfilePayload) => {
  return request<UserProfile>(api.patch("/users/me", payload));
};
