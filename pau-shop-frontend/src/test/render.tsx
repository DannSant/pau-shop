import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { makeStore } from "../app/store";
import CurrentLocation from "./CurrentLocation";

type State = Parameters<typeof makeStore>[0];

export function renderPage(
  ui: ReactElement,
  { route = "/", path = "*", state }: { route?: string; path?: string; state?: State } = {}
) {
  const store = makeStore(state);
  const user = userEvent.setup();
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          {path !== "*" && <Route path="*" element={<CurrentLocation />} />}
        </Routes>
      </MemoryRouter>
      <Toaster />
    </Provider>
  );
  return { store, user, ...view };
}

// A signed-in customer, as the auth slice holds it.
export const signedIn = (overrides: Partial<{ id: string; role: string; hasPhone: boolean }> = {}) => ({
  auth: {
    user: { id: "user-1", email: "ana@example.com", role: "user", hasPhone: true, ...overrides },
    token: "test-token",
    loading: false,
    error: null,
    isAuthenticated: true,
    confirmationRequired: false
  }
});
