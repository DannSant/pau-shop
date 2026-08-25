import { api } from "./axios";
import { request } from "./request";
import type { UserProfile } from "../types/user";

export interface CreateUserProfilePayload {
  name: string;
  phone: string;
}

export const createProfile = async (payload: CreateUserProfilePayload) => {
  return request<UserProfile>(api.post("/users/profile", payload));
};

export const getMe = async () => {
  return request<UserProfile>(api.get("/users/me"));
};
