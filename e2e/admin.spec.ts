import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { createCategory, createOrder, createProduct, createUser, login, service, unique } from "./support/app";

test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await login(page, await createUser({ role: "admin" }));
});

const productCard = (page: Page, name: string) =>
  page.locator("div", { has: page.getByText(name, { exact: true }) }).filter({ has: page.getByRole("button") }).last();

test.describe("products", () => {
  test("creates a product, adds images, edits, deletes and restores it", async ({ page }) => {
    const name = unique("Lámpara");
    const category = await createCategory({ name: { es: unique("Hogar") } });

    await page.goto("/admin");
    await page.getByRole("link", { name: "Nuevo producto" }).click();
    await page.getByLabel("Nombre (español)").fill(name);
    await page.getByLabel("Nombre (inglés, opcional)").fill("Lamp");
    await page.getByLabel("Descripción (español)").fill("Lámpara de escritorio");
    await page.getByLabel("Precio", { exact: true }).fill("450");
    await page.getByLabel("Stock").fill("7");
    await page.getByLabel("Categoría").selectOption(category.id);
    await page.getByLabel("Franquicia").fill("Fallout");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Producto creado. Ahora puedes agregar imágenes.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);
    const productId = page.url().split("/").pop()!;
    const { data: saved } = await service.from("products").select("name, price, stock, category_id").eq("id", productId).single();
    expect(saved).toEqual({ name: { es: name, en: "Lamp" }, price: 450, stock: 7, category_id: category.id });

    // Images: the first upload becomes the main image.
    const png = join(__dirname, "fixtures/product.png");
    await page.locator('input[type="file"]').setInputFiles([png, png]);
    await expect(page.getByText("Principal", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Hacer principal" })).toHaveCount(1);
    await page.getByRole("button", { name: "Hacer principal" }).click();
    await expect(page.getByRole("button", { name: "Hacer principal" })).toHaveCount(1);
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await expect(page.getByRole("button", { name: "Hacer principal" })).toHaveCount(0);
    await expect.poll(async () => (await service.from("product_images").select("id").eq("product_id", productId)).data?.length).toBe(1);

    // Edit
    await page.getByLabel("Precio de oferta").fill("399");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();

    // Delete and restore from the list
    await page.getByRole("link", { name: "Volver a productos" }).click();
    await productCard(page, name).getByRole("button", { name: "Eliminar" }).click();
    await expect(page.getByText("Producto eliminado")).toBeVisible();
    await page.goto("/browse");
    await expect(page.getByText(name)).toHaveCount(0);

    await page.goto("/admin");
    await page.getByRole("button", { name: "Eliminados" }).click();
    await productCard(page, name).getByRole("button", { name: "Restaurar" }).click();
    await expect(page.getByText("Producto restaurado")).toBeVisible();
    await page.goto("/browse");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("the offer price must be lower than the price", async ({ page }) => {
    await page.goto("/admin/products/new");
    await page.getByLabel("Nombre (español)").fill(unique("Oferta"));
    await page.getByLabel("Precio", { exact: true }).fill("100");
    await page.getByLabel("Precio de oferta").fill("150");
    await page.getByLabel("Stock").fill("1");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("El precio de oferta debe ser menor que el precio.")).toBeVisible();
  });
});

test.describe("categories", () => {
  test("creates and renames a category; duplicates are refused", async ({ page }) => {
    const name = unique("Figuras");
    await page.goto("/admin?tab=categories");

    const newForm = page.locator("form", { has: page.getByRole("button", { name: "Agregar" }) });
    await newForm.getByLabel("Nombre (español)").fill(name);
    await newForm.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByText("Categoría creada")).toBeVisible();

    await newForm.getByLabel("Nombre (español)").fill(name);
    await newForm.getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByText("Ya existe una categoría con ese nombre.")).toBeVisible();

    // Each saved category shows its slug, which doesn't change on rename.
    const slug = name.toLowerCase().replace(" ", "-");
    const row = page.locator("form").filter({ hasText: slug });
    await row.getByLabel("Nombre (español)").fill(`${name} y más`);
    await row.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Categoría actualizada")).toBeVisible();
  });
});

test.describe("orders", () => {
  test("changes the shipping status of a paid order", async ({ page }) => {
    const customer = await createUser({ name: unique("Cliente") });
    const order = await createOrder(customer.id, await createProduct(), { status: "paid" });

    await page.goto("/admin?tab=orders");
    const card = page.locator("div", { has: page.getByText(customer.name, { exact: true }) }).filter({ has: page.locator("select") }).last();
    await card.locator("select").selectOption("shipped");

    await expect(page.getByText("Estado de envío actualizado")).toBeVisible();
    await expect.poll(async () => (await service.from("orders").select("shipping_status").eq("id", order.id).single()).data!.shipping_status).toBe("shipped");
  });

  test("unpaid orders can't be shipped", async ({ page }) => {
    const customer = await createUser({ name: unique("Pendiente") });
    await createOrder(customer.id, await createProduct(), { status: "pending" });

    await page.goto("/admin?tab=orders");
    const card = page.locator("div", { has: page.getByText(customer.name, { exact: true }) }).filter({ has: page.locator("select") }).last();
    await expect(card.locator('option[value="shipped"]')).toBeDisabled();
  });
});
