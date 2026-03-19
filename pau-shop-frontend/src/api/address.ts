import { api } from "./axios";
import { request } from "./request";
import { type Address } from "../types/address";

export const getAddressesApi = async () => {
  return request<Address[]>(api.get("/addresses"));
}

export const createAddressApi = async (address: Omit<Address, "id" | "user_id" | "created_at">) => {
  return request<Address>(api.post("/addresses", address));
}

export const updateAddressApi = async (address: Address) => {
  return request<Address>(api.put(`/addresses/${address.id}`, address));
}