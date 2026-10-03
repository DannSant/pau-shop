import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createCategory, createProduct, createReview, createUser, TestUser } from "../helpers/factories";

let admin: TestUser;
let customer: TestUser;

beforeAll(async () => {
  await resetData();
  admin = await createUser({ role: "admin" });
  customer = await createUser();
});

const validProduct = (overrides: object = {}) => ({
  name: { es: "Taza Nuka", en: "Nuka Mug" },
  description: { es: "Taza de cerámica" },
  price: 250,
  offer_price: null,
  stock: 5,
  category_id: null,
  franchise: "Fallout",
  ...overrides
});

describe("GET /products (store)", () => {
  it("lists active products with category, images and rating", async () => {
    const category = await createCategory();
    const product = await createProduct({ category_id: category.id });
    const reviewer = await createUser();
    await createReview(reviewer.id, product.id, { score: 4 });
    await createProduct({ deleted_at: new Date().toISOString(), name: { es: "Borrado" } });

    const res = await api.get("/products");

    expect(res.status).toBe(200);
    const listed = res.body.data.find((p: any) => p.id === product.id);
    expect(listed.category.slug).toBe(category.slug);
    expect(listed.product_images).toEqual([]);
    expect(listed.rating).toEqual({ average: 4, count: 1 });
    expect(res.body.data.some((p: any) => p.name.es === "Borrado")).toBe(false);
  });
});

describe("admin product endpoints", () => {
  it("rejects signed-out visitors (401) and customers (403)", async () => {
    expect((await api.get("/products/admin")).status).toBe(401);
    expect((await api.get("/products/admin", customer.token)).status).toBe(403);
    expect((await api.post("/products", validProduct(), customer.token)).status).toBe(403);
  });

  it("creates a product, keeping only known fields", async () => {
    const res = await api.post("/products", validProduct({ id: "hijack", deleted_at: "2020-01-01", stock: 3 }), admin.token);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: { es: "Taza Nuka", en: "Nuka Mug" }, price: 250, stock: 3, deleted_at: null });
    expect(res.body.data.id).not.toBe("hijack");
  });

  it.each([
    ["no Spanish name", { name: { en: "Mug" } }, "name.es is required"],
    ["price 0", { price: 0 }, "price must be a positive number"],
    ["price as text", { price: "250" }, "price must be a positive number"],
    ["offer not lower than price", { offer_price: 250 }, "offer_price must be lower than price"],
    ["negative stock", { stock: -1 }, "stock must be a whole number of 0 or more"],
    ["fractional stock", { stock: 1.5 }, "stock must be a whole number of 0 or more"],
    ["description without es", { description: { en: "x" } }, "description must be null or include a non-empty 'es'"]
  ])("rejects %s (400)", async (_label, overrides, message) => {
    const res = await api.post("/products", validProduct(overrides), admin.token);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  it("drops blank optional languages", async () => {
    const res = await api.post("/products", validProduct({ name: { es: " Taza ", en: "  " } }), admin.token);
    expect(res.body.data.name).toEqual({ es: "Taza" });
  });

  it("updates only the fields sent", async () => {
    const product = await createProduct({ price: 100, stock: 4 });
    const res = await api.put(`/products/${product.id}`, { stock: 9 }, admin.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ stock: 9, price: 100 });
  });

  it("returns 404 for unknown products", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    expect((await api.put(`/products/${missing}`, { stock: 1 }, admin.token)).status).toBe(404);
    expect((await api.get(`/products/admin/${missing}`, admin.token)).status).toBe(404);
    expect((await api.delete(`/products/${missing}`, admin.token)).status).toBe(404);
    expect((await api.post(`/products/${missing}/restore`, {}, admin.token)).status).toBe(404);
  });

  it("returns 404 for ids that aren't valid", async () => {
    expect((await api.get("/products/admin/not-an-id", admin.token)).status).toBe(404);
    expect((await api.put("/products/not-an-id", { stock: 1 }, admin.token)).status).toBe(404);
  });

  it("soft deletes and restores", async () => {
    const product = await createProduct();

    const deleted = await api.delete(`/products/${product.id}`, admin.token);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted_at).not.toBeNull();

    const store = await api.get("/products");
    expect(store.body.data.some((p: any) => p.id === product.id)).toBe(false);
    const trash = await api.get("/products/admin?deleted=true", admin.token);
    expect(trash.body.data.some((p: any) => p.id === product.id)).toBe(true);

    const restored = await api.post(`/products/${product.id}/restore`, {}, admin.token);
    expect(restored.body.data.deleted_at).toBeNull();
    const active = await api.get("/products/admin", admin.token);
    expect(active.body.data.some((p: any) => p.id === product.id)).toBe(true);
  });
});
