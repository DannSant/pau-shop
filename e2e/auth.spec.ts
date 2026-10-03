import { expect, test } from "@playwright/test";
import { createUser, login, logout, PASSWORD, service, unique } from "./support/app";

test.describe("sign up, sign in, sign out", () => {
  test("signs up and lands signed in, with the profile saved", async ({ page }) => {
    const email = `${unique("signup").replace(" ", "-")}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Nombre completo").fill("Sofía Nueva");
    await page.getByLabel("Teléfono").fill("5551239876");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirmar contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Registrarme" }).click();

    await expect(page.getByRole("link", { name: "Perfil" })).toBeVisible();
    await expect(page).toHaveURL("/");
    await expect
      .poll(async () => (await service.from("user_data").select("name, phone, role").eq("email", email).maybeSingle()).data)
      .toEqual({ name: "Sofía Nueva", phone: "5551239876", role: "user" });
  });

  test("sign up: passwords must match", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Nombre completo").fill("X");
    await page.getByLabel("Teléfono").fill("5551239876");
    await page.getByLabel("Correo electrónico").fill("mismatch@example.com");
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirmar contraseña").fill("otra-cosa");
    await page.getByRole("button", { name: "Registrarme" }).click();
    await expect(page.getByText("Las contraseñas no coinciden")).toBeVisible();
  });

  test("wrong password shows a clear message", async ({ page }) => {
    const user = await createUser();
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(user.email);
    await page.getByLabel("Contraseña").fill("incorrecta");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });

  test("signs in and out", async ({ page }) => {
    const user = await createUser();
    await login(page, user);
    await expect(page.getByRole("link", { name: "Perfil" })).toBeVisible();

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("page access", () => {
  test("a protected page sends you to log in, then back", async ({ page }) => {
    const user = await createUser();
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel("Correo electrónico").fill(user.email);
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("signed-in users skip the login page", async ({ page }) => {
    await login(page, await createUser());
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("only admins reach the admin page", async ({ page }) => {
    await login(page, await createUser());
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin/);
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);

    await logout(page);
    await login(page, await createUser({ role: "admin" }));
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  });

  test("users without a phone must add one first", async ({ page }) => {
    const user = await createUser({ phone: null, name: "Gabriela Google" });
    await login(page, user);

    await expect(page).toHaveURL(/\/complete-profile/);
    await expect(page.getByLabel("Nombre completo")).toHaveValue("Gabriela Google");
    await page.goto("/browse");
    await expect(page).toHaveURL(/\/complete-profile/);

    await page.getByLabel("Teléfono").fill("5559871234");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).not.toHaveURL(/\/complete-profile/);
  });

  test("Google sign-in errors are explained", async ({ page }) => {
    await page.goto("/login?error=access_denied");
    await expect(page.getByText("Cancelaste el inicio de sesión con Google.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  });
});
