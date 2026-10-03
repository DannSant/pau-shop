import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createCategory, createUser, TestUser } from "../helpers/factories";

let admin: TestUser;
let customer: TestUser;

beforeAll(async () => {
  await resetData();
  admin = await createUser({ role: "admin" });
  customer = await createUser();
});

describe("categories", () => {
  it("lists categories for everyone, in sort order", async () => {
    await createCategory({ slug: "zeta", sort_order: 2 });
    await createCategory({ slug: "alfa", sort_order: 1 });

    const res = await api.get("/categories");

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: any) => c.slug)).toEqual(["alfa", "zeta"]);
  });

  it("only admins can create or rename (401/403)", async () => {
    const body = { name: { es: "Figuras" } };
    expect((await api.post("/categories", body)).status).toBe(401);
    expect((await api.post("/categories", body, customer.token)).status).toBe(403);
  });

  it("creates a category with a slug made from the Spanish name", async () => {
    const res = await api.post("/categories", { name: { es: "Figuras de Acción", en: "Action Figures" }, sort_order: 3 }, admin.token);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ slug: "figuras-de-accion", sort_order: 3 });
  });

  it("rejects a duplicate name (409)", async () => {
    await api.post("/categories", { name: { es: "Pósters" } }, admin.token);
    const res = await api.post("/categories", { name: { es: "Posters" } }, admin.token);
    expect(res.status).toBe(409);
  });

  it.each([
    ["no Spanish name", { name: { en: "Mugs" } }],
    ["a fractional sort order", { name: { es: "Tazas" }, sort_order: 1.5 }]
  ])("rejects %s (400)", async (_label, body) => {
    expect((await api.post("/categories", body, admin.token)).status).toBe(400);
  });

  it("renames without changing the slug", async () => {
    const category = await createCategory({ slug: "llaveros", name: { es: "Llaveros" } });
    const res = await api.put(`/categories/${category.id}`, { name: { es: "Llaveros y más" } }, admin.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: "llaveros", name: { es: "Llaveros y más" } });
  });

  it("returns 404 for unknown categories", async () => {
    const res = await api.put("/categories/00000000-0000-0000-0000-000000000000", { sort_order: 1 }, admin.token);
    expect(res.status).toBe(404);
  });
});
