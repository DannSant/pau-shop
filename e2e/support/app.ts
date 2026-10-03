import "./env";
import { expect, type Page } from "@playwright/test";
import { PASSWORD, type TestUser } from "../../pau-shop-backend/tests/helpers/factories";

// Test data helpers shared with the backend suite (local database only).
export * from "../../pau-shop-backend/tests/helpers/factories";

export const API = "http://localhost:4100/api";

let counter = 0;
export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function login(page: Page, user: Pick<TestUser, "email">) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
}

// Puts items straight into the saved cart (as the product page would).
export async function fillCart(page: Page, items: { product: { id: string; name: object; price: number }; quantity: number }[]) {
  if (!page.url().startsWith("http")) await page.goto("/");
  await page.evaluate((cart) => localStorage.setItem("cart", JSON.stringify(cart)), items.map(({ product, quantity }) => ({
    product_id: product.id,
    name: product.name,
    price: product.price,
    quantity
  })));
}

export const cartCount = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]").length as number);
