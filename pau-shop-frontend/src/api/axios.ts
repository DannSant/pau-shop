import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

/*
api.interceptors.response.use(
  (response) => {
    const backendResponse = response.data;

    if (backendResponse.error) {
      return Promise.reject(new Error(backendResponse.error));
    }

    return backendResponse.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);*/


