import { expect, test } from "@playwright/test";
import { createOrder, createProduct, createReview, createUser, login, logout, service, unique } from "./support/app";

test.beforeEach(({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

test("a customer who received the product writes, edits and deletes a review", async ({ page }) => {
  const product = await createProduct({ name: { es: unique("Peluche") } });
  const user = await createUser({ name: "Daniel Santiago López" });
  await createOrder(user.id, product, { status: "paid", shipping_status: "arrived" });
  await login(page, user);
  await page.goto(`/products/${product.id}`);

  await page.getByRole("button", { name: "4 estrellas" }).click();
  await page.locator("#review-comment").fill("Muy suave");
  await page.getByRole("button", { name: "Publicar reseña" }).click();
  await expect(page.getByText("¡Gracias por tu reseña!")).toBeVisible();
  await expect(page.getByText("Daniel L.")).toBeVisible();
  await expect(page.getByText("1 reseña").first()).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByRole("button", { name: "2 estrellas" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Reseña actualizada")).toBeVisible();
  await expect(page.getByText("(editada)")).toBeVisible();

  await page.locator("#reviews").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Reseña eliminada")).toBeVisible();
  await expect(page.getByText("Este producto aún no tiene reseñas.")).toBeVisible();
});

test("customers who haven't received the product can't review it", async ({ page }) => {
  const product = await createProduct();
  const user = await createUser();
  await createOrder(user.id, product, { status: "paid", shipping_status: "shipped" });
  await login(page, user);
  await page.goto(`/products/${product.id}`);

  await expect(page.getByText("Podrás dejar una reseña cuando recibas este producto.")).toBeVisible();
  await expect(page.locator("#review-comment")).toHaveCount(0);
});

test("an admin deletes a review and bans its author, who then sees a message", async ({ page }) => {
  const product = await createProduct({ name: { es: unique("Taza") } });
  const troll = await createUser({ name: unique("Troll") });
  await createOrder(troll.id, product, { status: "paid", shipping_status: "arrived" });
  await createReview(troll.id, product.id, { score: 1, comment: "Comentario ofensivo" });

  await login(page, await createUser({ role: "admin" }));
  await page.goto("/admin?tab=reviews");
  const card = page.locator("div", { has: page.getByText("Comentario ofensivo") }).filter({ has: page.getByRole("button", { name: "Eliminar" }) }).last();
  await card.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText("Reseña eliminada")).toBeVisible();
  await expect(page.getByText("Comentario ofensivo")).toHaveCount(0);

  await page.goto(`/admin/users/${troll.id}`);
  await expect(page.getByText("Comentario ofensivo")).toBeVisible();
  await page.locator("#ban-note").fill("Lenguaje ofensivo");
  await page.getByRole("button", { name: "Bloquear reseñas" }).click();
  await expect(page.getByText("Usuario bloqueado")).toBeVisible();
  const { data } = await service.from("review_bans").select("note").eq("user_id", troll.id).single();
  expect(data!.note).toBe("Lenguaje ofensivo");

  await logout(page);
  await login(page, troll);
  await page.goto(`/products/${product.id}`);
  await expect(page.getByText("Tu cuenta ya no puede publicar reseñas.")).toBeVisible();
});
