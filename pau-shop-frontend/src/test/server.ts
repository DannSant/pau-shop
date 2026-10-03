import { HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Fake backend for component tests. Tests add handlers with server.use(...).
export const server = setupServer();

export const API = "http://api.test/api";

// The backend's response shape: { data, error }.
export const ok = (data: unknown, status = 200) => HttpResponse.json({ data, error: null }, { status });
export const fail = (status: number, error: string) => HttpResponse.json({ data: null, error }, { status });
