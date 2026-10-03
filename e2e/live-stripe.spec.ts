import { expect, test } from "@playwright/test";
import { createAddress, createProduct, createUser, fillCart, login, service, unique } from "./support/app";

// Optional: pays on Stripe's real test-mode page with a test card.
// Run with `npm run test:e2e:stripe` (needs internet and the Stripe test key in
// pau-shop-backend/.env). Creates one test-mode payment in Stripe.
test("@live-stripe pays the full total with Stripe's test card", async ({ page }) => {
  test.setTimeout(120_000);
  const user = await createUser();
  await createAddress(user.id);
  const product = await createProduct({ name: { es: unique("Taza") }, price: 19.99, stock: 5 });
  await login(page, user);
  await fillCart(page, [{ product, quantity: 1 }]);

  await page.goto("/checkout");
  await expect(page.getByText("Calle Falsa 123")).toBeVisible();
  await page.getByRole("button", { name: "Usar esta dirección" }).click();
  await page.getByRole("button", { name: "Pagar ahora" }).click();

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  await expect(page.getByText("MXN 424.89").first()).toBeVisible({ timeout: 30_000 });
  if (await page.locator("#email").count()) await page.fill("#email", user.email);
  await page.fill("#cardNumber", "4242 4242 4242 4242");
  await page.fill("#cardExpiry", "12 / 34");
  await page.fill("#cardCvc", "123");
  if (await page.locator("#billingName").count()) await page.fill("#billingName", "Prueba Stripe");
  if (await page.locator("#billingPostalCode").count()) await page.fill("#billingPostalCode", "94103");
  await page.locator('button[type="submit"]').first().click();

  // Without a webhook locally, the success page asks Stripe directly.
  await expect(page.getByText("¡Gracias por tu compra!")).toBeVisible({ timeout: 60_000 });
  const { data } = await service.from("orders").select("status, total_amount").eq("user_id", user.id).single();
  expect(data).toEqual({ status: "paid", total_amount: 424.89 });
});
