import { api } from "./axios";
import { request } from "./request";

export interface PostalCodeInfo {
  postal_code: string;
  state: string;
  city: string;
  neighborhoods: string[];
}

export const getPostalCodeApi = async (code: string) => {
  return request<PostalCodeInfo>(api.get(`/postal-codes/${code}`));
}
