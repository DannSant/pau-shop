import { expect, test, type Page } from "@playwright/test";
import { cartCount, createAddress, createProduct, createUser, fillCart, login, service, unique } from "./support/app";

const stockOf = async (id: string) => (await service.from("products").select("stock").eq("id", id).single()).data!.stock;

async function confirmFirstAddress(page: Page) {
  // Wait for the saved address to load before choosing it.
  await expect(page.getByText("Calle Falsa 123")).toBeVisible();
  await page.getByRole("button", { name: "Usar esta dirección" }).click();
  await expect(page.getByRole("button", { name: "Usar otra dirección" })).toBeVisible();
}

test.describe("addresses at checkout", () => {
  test("adds a new address and edits it", async ({ page }) => {
    const user = await createUser();
    const product = await createProduct();
    await login(page, user);
    await fillCart(page, [{ product, quantity: 1 }]);
    await page.goto("/checkout");

    await page.getByRole("button", { name: "Agregar nueva dirección" }).click();
    await page.getByPlaceholder("Nombre", { exact: true }).fill("Lucía");
    await page.getByPlaceholder("Apellido").fill("Marín");
    await page.getByPlaceholder("Calle").fill("Insurgentes Sur");
    await page.getByPlaceholder("Número exterior").fill("1500");
    // The postal code fills state and city (sample codes in seed.sql); 03100
    // has two colonias, so the customer picks one.
    await page.getByPlaceholder("Código postal").fill("03100");
    await expect(page.getByLabel("Estado")).toHaveValue("Ciudad de México");
    await expect(page.getByPlaceholder("Ciudad")).toHaveValue("Ciudad de México");
    await page.getByPlaceholder("Colonia").fill("Del Valle Centro");
    await page.getByPlaceholder("Teléfono").fill("5512345678");
    await page.getByRole("button", { name: "Usar esta dirección" }).click();
    await expect(page.getByText("Insurgentes Sur 1500")).toBeVisible();

    await page.getByRole("button", { name: "Usar otra dirección" }).click();
    await page.getByRole("button", { name: "Editar dirección" }).click();
    await page.getByPlaceholder("Calle").fill("Reforma");
    await page.getByRole("button", { name: "Usar esta dirección" }).click();
    await expect(page.getByText("Reforma 1500")).toBeVisible();

    const { data } = await service.from("shipping_addresses").select("street").eq("user_id", user.id);
    expect(data).toEqual([{ street: "Reforma" }]);
  });

  test("an incomplete address shows an error and isn't saved", async ({ page }) => {
    const user = await createUser();
    await login(page, user);
    await fillCart(page, [{ product: await createProduct(), quantity: 1 }]);
    await page.goto("/checkout");

    await page.getByRole("button", { name: "Agregar nueva dirección" }).click();
    await page.getByPlaceholder("Calle").fill("Solo calle");
    await page.getByRole("button", { name: "Usar esta dirección" }).click();

    await expect(page.getByRole("alert")).toContainText("todos los campos son obligatorios");
    const { data } = await service.from("shipping_addresses").select("id").eq("user_id", user.id);
    expect(data).toEqual([]);
  });
});

test.describe("paying", () => {
  test("pays on the (fake) Stripe page: thank-you page, order paid, cart emptied", async ({ page }) => {
    const user = await createUser();
    await createAddress(user.id);
    const product = await createProduct({ name: { es: unique("Taza") }, price: 19.99, stock: 5 });
    await login(page, user);
    await fillCart(page, [{ product, quantity: 2 }]);
    await page.goto("/checkout");
    await expect(page.getByText("$449.78")).toBeVisible();

    await confirmFirstAddress(page);
    await page.getByRole("button", { name: "Pagar ahora" }).click();

    await expect(page.locator("#total")).toHaveText("MXN 449.78");
    await page.getByRole("button", { name: "Pagar" }).click();

    await expect(page.getByText("¡Gracias por tu compra!")).toBeVisible();
    expect(await cartCount(page)).toBe(0);
    const { data } = await service.from("orders").select("status, total_amount").eq("user_id", user.id);
    expect(data).toEqual([{ status: "paid", total_amount: 449.78 }]);
    expect(await stockOf(product.id)).toBe(3);
  });

  test("coming back without paying cancels the order and returns the stock", async ({ page }) => {
    const user = await createUser();
    await createAddress(user.id);
    const product = await createProduct({ stock: 5 });
    await login(page, user);
    await fillCart(page, [{ product, quantity: 1 }]);
    await page.goto("/checkout");
    await confirmFirstAddress(page);
    await page.getByRole("button", { name: "Pagar ahora" }).click();
    await expect(page.getByRole("button", { name: "Pagar" })).toBeVisible();
    expect(await stockOf(product.id)).toBe(4);

    await page.getByRole("link", { name: "Volver" }).click();

    await expect(page.getByText("El pago no se completó. Tu carrito sigue aquí")).toBeVisible();
    expect(await cartCount(page)).toBe(1);
    await expect.poll(() => stockOf(product.id)).toBe(5);
    const { data } = await service.from("orders").select("status").eq("user_id", user.id);
    expect(data).toEqual([{ status: "cancelled" }]);
  });

  test("not enough stock: a clear message, and the button works again", async ({ page }) => {
    const user = await createUser();
    await createAddress(user.id);
    const product = await createProduct({ stock: 1 });
    await login(page, user);
    await fillCart(page, [{ product, quantity: 3 }]);
    await page.goto("/checkout");
    await confirmFirstAddress(page);
    await page.getByRole("button", { name: "Pagar ahora" }).click();

    await expect(page.getByRole("alert")).toContainText("ya no tiene suficientes existencias");
    await expect(page.getByRole("button", { name: "Pagar ahora" })).toBeEnabled();
  });
});
