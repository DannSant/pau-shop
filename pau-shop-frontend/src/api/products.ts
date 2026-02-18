import { api } from "./axios";
import { request } from "./request";
import { type Product } from "../types/product";

export const getProducts = async () => {
  return request<Product[]>(api.get("/products"));
};
