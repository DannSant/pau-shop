import { expect, test } from "@playwright/test";
import { createCategory, createProduct, unique } from "./support/app";

test.describe("browsing the store", () => {
  test("filters by category and searches by name or description, ignoring accents", async ({ page }) => {
    const tag = unique("Cat").split(" ")[1];
    const category = await createCategory({ name: { es: `Pósters ${tag}` } });
    const poster = await createProduct({ name: { es: `Póster Película ${tag}` }, category_id: category.id });
    const mug = await createProduct({ name: { es: `Taza ${tag}` }, description: { es: "Taza de cerámica" } });

    await page.goto("/browse");
    await expect(page.getByText(`Póster Película ${tag}`)).toBeVisible();
    await expect(page.getByText(`Taza ${tag}`)).toBeVisible();

    await page.getByRole("button", { name: `Pósters ${tag}` }).click();
    await expect(page).toHaveURL(new RegExp(`category=${category.slug}`));
    await expect(page.getByText(`Póster Película ${tag}`)).toBeVisible();
    await expect(page.getByText(`Taza ${tag}`)).toHaveCount(0);
    await page.getByRole("button", { name: "Todas" }).first().click();
    // Wait for the filter to clear before searching: the search box builds its
    // URL from the last render, so typing too soon would bring the category back.
    await expect(page.getByText(`Taza ${tag}`)).toBeVisible();

    const search = page.getByPlaceholder("Buscar por nombre o descripción");
    await search.fill(`pelicula ${tag}`);
    await expect(page.getByText(`Póster Película ${tag}`)).toBeVisible();
    await expect(page.getByText(`Taza ${tag}`)).toHaveCount(0);

    await search.fill("CERAMICA");
    await expect(page.getByText(`Taza ${tag}`)).toBeVisible();

    await search.fill(`nada-${tag}`);
    await expect(page.getByText(`No hay productos que coincidan con "nada-${tag}".`)).toBeVisible();

    await page.getByRole("button", { name: "Borrar búsqueda" }).click();
    await expect(page.getByText(`Póster Película ${tag}`)).toBeVisible();
    expect([poster.id, mug.id]).toHaveLength(2);
  });

  test("shows a product page and adds it to the cart", async ({ page }) => {
    const product = await createProduct({ name: { es: unique("Llavero") }, price: 120, offer_price: 99, stock: 3 });

    await page.goto(`/products/${product.id}`);
    await expect(page.getByRole("heading", { name: (product.name as any).es })).toBeVisible();
    await expect(page.getByText("No hay reseñas")).toBeVisible();

    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.locator('nav a[href="/cart"]')).toContainText("1");
  });

  test("unknown pages show the 404 page", async ({ page }) => {
    await page.goto("/esto-no-existe");
    await expect(page.getByText("Página no encontrada")).toBeVisible();
    await page.getByRole("link", { name: "Explorar productos" }).click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test("switches to English and back", async ({ page }) => {
    const product = await createProduct({ name: { es: unique("Gorra"), en: "Cap EN" } });
    await page.goto("/browse");

    await page.locator('nav button[lang="en"]').click();
    await expect(page.getByRole("link", { name: "Browse" })).toBeVisible();
    await expect(page.getByText("Cap EN")).toBeVisible();

    await page.locator('nav button[lang="es"]').click();
    await expect(page.getByRole("link", { name: "Explorar" })).toBeVisible();
    await expect(page.getByText((product.name as any).es)).toBeVisible();
  });
});
