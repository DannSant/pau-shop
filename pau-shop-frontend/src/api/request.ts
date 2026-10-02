
interface BackendResponse<T> {
  data: T;
  error: string | null;
}

export async function request<T>(
  promise: Promise<{ data: BackendResponse<T> }>
): Promise<T> {
  const response = await promise;
  const backendResponse: BackendResponse<T> = response.data;

  if (backendResponse.error) {
    throw new Error(backendResponse.error);
  }

  return backendResponse.data;
}

// The backend's error text, e.g. "Insufficient stock" (axios puts it on the
// response of a failed request).
export function apiErrorMessage(err: unknown): string {
  const response = (err as { response?: { data?: { error?: unknown } } })?.response;
  if (typeof response?.data?.error === "string") return response.data.error;
  return err instanceof Error ? err.message : "";
}
