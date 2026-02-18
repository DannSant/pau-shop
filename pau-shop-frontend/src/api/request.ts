import { api } from "./axios";

interface BackendResponse<T> {
  data: T;
  error: string | null;
}

export async function request<T>(
  promise: Promise<any>
): Promise<T> {
  const response = await promise;
  const backendResponse: BackendResponse<T> = response.data;

  if (backendResponse.error) {
    throw new Error(backendResponse.error);
  }

  return backendResponse.data;
}
