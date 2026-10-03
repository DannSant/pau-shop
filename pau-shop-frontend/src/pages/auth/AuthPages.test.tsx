import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "../../test/render";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

// Supabase auth is replaced; each test decides what it answers.
const auth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn()
}));
vi.mock("../../lib/supabase", () => ({ supabase: { auth } }));

const authError = (code: string) => ({ data: { user: null, session: null }, error: Object.assign(new Error(code), { code }) });

beforeEach(() => vi.clearAllMocks());

describe("LoginPage", () => {
  it("explains wrong credentials in Spanish", async () => {
    auth.signInWithPassword.mockResolvedValue(authError("invalid_credentials"));
    const { user } = renderPage(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "mala");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "ana@example.com", password: "mala" });
  });

  it("falls back to a general message for unknown errors", async () => {
    auth.signInWithPassword.mockResolvedValue(authError("something_new"));
    const { user } = renderPage(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "x");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("No pudimos iniciar sesión. Inténtalo de nuevo.")).toBeInTheDocument();
  });

  it("shows why a Google sign-in didn't finish", () => {
    window.history.replaceState(null, "", "/login?error=access_denied");
    renderPage(<LoginPage />, { route: "/login" });
    expect(screen.getByText("Cancelaste el inicio de sesión con Google.")).toBeInTheDocument();
    window.history.replaceState(null, "", "/");
  });
});

describe("SignupPage", () => {
  const fill = async (user: ReturnType<typeof renderPage>["user"], confirm = "Password123!") => {
    await user.type(screen.getByLabelText("Nombre completo"), "Ana López");
    await user.type(screen.getByLabelText("Teléfono"), "5551234567");
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await user.type(screen.getByLabelText("Contraseña", { exact: true }), "Password123!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), confirm);
    await user.click(screen.getByRole("button", { name: "Registrarme" }));
  };

  it("checks that the passwords match before calling Supabase", async () => {
    const { user } = renderPage(<SignupPage />, { route: "/signup" });
    await fill(user, "otra");
    expect(screen.getByText("Las contraseñas no coinciden")).toBeInTheDocument();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("sends name and phone with the sign-up", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: "u1", email: "ana@example.com" }, session: null }, error: null });
    const { user } = renderPage(<SignupPage />, { route: "/signup" });
    await fill(user);

    expect(await screen.findByText("Revisa tu correo")).toBeInTheDocument();
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana@example.com", options: expect.objectContaining({ data: { name: "Ana López", phone: "5551234567" } }) })
    );
  });

  it("explains an email that's already registered", async () => {
    auth.signUp.mockResolvedValue(authError("user_already_exists"));
    const { user } = renderPage(<SignupPage />, { route: "/signup" });
    await fill(user);
    expect(await screen.findByText("Ya existe una cuenta con este correo.")).toBeInTheDocument();
  });
});
