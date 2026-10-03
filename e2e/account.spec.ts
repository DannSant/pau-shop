import { expect, test } from "@playwright/test";
import { createOrder, createProduct, createUser, login, service, unique } from "./support/app";

test.describe("profile", () => {
  test("edits name and phone; an invalid phone isn't accepted", async ({ page }) => {
    const user = await createUser({ name: "Nombre Viejo" });
    await login(page, user);
    await page.goto("/profile");
    await expect(page.getByText(user.email)).toBeVisible();

    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Teléfono").fill("abc");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByLabel("Teléfono")).toBeVisible();

    await page.getByLabel("Nombre").fill("Nombre Nuevo");
    await page.getByLabel("Teléfono").fill("+52 55 4444 3333");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Perfil actualizado")).toBeVisible();
    await expect(page.getByText("Nombre Nuevo")).toBeVisible();
    const { data } = await service.from("user_data").select("name, phone").eq("id", user.id).single();
    expect(data).toEqual({ name: "Nombre Nuevo", phone: "+52 55 4444 3333" });
  });
});

test.describe("orders", () => {
  test("history and details show status, shipping and items", async ({ page }) => {
    const user = await createUser();
    const product = await createProduct({ name: { es: unique("Figura") }, price: 300 });
    const shipped = await createOrder(user.id, product, { status: "paid", shipping_status: "shipped" });
    const cancelled = await createOrder(user.id, product, { status: "cancelled" });
    await login(page, user);

    await page.goto("/profile?tab=orders");
    await expect(page.getByText("Pagado")).toBeVisible();
    await expect(page.getByText("Enviado")).toBeVisible();
    await expect(page.getByText("Cancelado")).toBeVisible();

    await page.goto(`/orders/${shipped.id}`);
    await expect(page.getByText((product.name as any).es)).toBeVisible();
    await expect(page.getByText("Tu pedido va en camino.")).toBeVisible();

    await page.goto(`/orders/${cancelled.id}`);
    await expect(page.getByText("Este pedido se canceló porque el pago no se completó.")).toBeVisible();
  });

  test("another customer's order isn't shown", async ({ page }) => {
    const owner = await createUser();
    const order = await createOrder(owner.id, await createProduct());
    await login(page, await createUser());
    await page.goto(`/orders/${order.id}`);
    await expect(page.getByText("No encontramos este pedido")).toBeVisible();
  });

  test("the thank-you page explains a cancelled payment", async ({ page }) => {
    const user = await createUser();
    const order = await createOrder(user.id, await createProduct(), { status: "cancelled" });
    await login(page, user);
    await page.goto(`/order-success?order_id=${order.id}`);
    await expect(page.getByRole("heading", { name: "El pago no se completó" })).toBeVisible();
  });
});
