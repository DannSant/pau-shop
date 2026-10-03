import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createOrder, createProduct, createReview, createUser, service, TestUser } from "../helpers/factories";

let product: { id: string; name: object; price: number };

beforeAll(async () => {
  await resetData();
  product = await createProduct();
});

// A customer who received the product (paid and delivered).
async function buyer(name = "Daniel Santiago López") {
  const user = await createUser({ name });
  await createOrder(user.id, product, { status: "paid", shipping_status: "arrived" });
  return user;
}

const reviewsPath = (id = product.id) => `/products/${id}/reviews`;

describe("public reviews", () => {
  it("lists reviews with a short author name and no user ids, plus the average", async () => {
    const a = await createUser({ name: "Daniel Santiago López" });
    const b = await createUser({ name: "Ana" });
    const p = await createProduct();
    await createReview(a.id, p.id, { score: 5 });
    await createReview(b.id, p.id, { score: 2 });

    const res = await api.get(reviewsPath(p.id));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ average: 3.5, count: 2 });
    expect(res.body.data.reviews.map((r: any) => r.author).sort()).toEqual(["Ana", "Daniel L."]);
    expect(JSON.stringify(res.body.data)).not.toContain(a.id);
  });

  it("returns an empty summary for a product without reviews", async () => {
    const p = await createProduct();
    const res = await api.get(reviewsPath(p.id));
    expect(res.body.data).toEqual({ average: null, count: 0, reviews: [] });
  });
});

describe("writing reviews", () => {
  it("needs a signed-in user (401)", async () => {
    expect((await api.put(reviewsPath(), { score: 5 })).status).toBe(401);
  });

  it("only customers who received the product can review it (403)", async () => {
    const notDelivered = await createUser();
    await createOrder(notDelivered.id, product, { status: "paid", shipping_status: "shipped" });
    const unpaid = await createUser();
    await createOrder(unpaid.id, product, { status: "pending", shipping_status: "arrived" });

    for (const user of [notDelivered, unpaid, await createUser()]) {
      const res = await api.put(reviewsPath(), { score: 5 }, user.token);
      expect(res.status).toBe(403);
      expect((await api.get(`${reviewsPath()}/me`, user.token)).body.data).toMatchObject({ canReview: false });
    }
  });

  it("creates a review (201), then replaces it and marks it edited (200)", async () => {
    const user = await buyer();
    expect((await api.get(`${reviewsPath()}/me`, user.token)).body.data).toEqual({ canReview: true, banned: false, review: null });

    const created = await api.put(reviewsPath(), { score: 4, comment: "  Muy buena  " }, user.token);
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ score: 4, comment: "Muy buena", updated_at: null });

    const edited = await api.post(reviewsPath(), { score: 2, comment: "" }, user.token);
    expect(edited.status).toBe(200);
    expect(edited.body.data).toMatchObject({ id: created.body.data.id, score: 2, comment: null });
    expect(edited.body.data.updated_at).not.toBeNull();

    const { count } = await service.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    expect(count).toBe(1);
  });

  it.each([
    ["no score", {}],
    ["score 0", { score: 0 }],
    ["score 6", { score: 6 }],
    ["score 4.5", { score: 4.5 }],
    ["a comment that is too long", { score: 5, comment: "x".repeat(1001) }],
    ["a comment that isn't text", { score: 5, comment: 42 }]
  ])("rejects %s (400)", async (_label, body) => {
    const user = await buyer();
    expect((await api.put(reviewsPath(), body, user.token)).status).toBe(400);
  });

  it("can't review a deleted or unknown product (404)", async () => {
    const user = await buyer();
    const deleted = await createProduct({ deleted_at: new Date().toISOString() });
    expect((await api.put(reviewsPath(deleted.id), { score: 5 }, user.token)).status).toBe(404);
    expect((await api.put(reviewsPath("00000000-0000-0000-0000-000000000000"), { score: 5 }, user.token)).status).toBe(404);
  });

  it("deletes own review; deleting again is 404", async () => {
    const user = await buyer();
    await api.put(reviewsPath(), { score: 5 }, user.token);

    expect((await api.delete(reviewsPath(), user.token)).status).toBe(200);
    expect((await api.delete(reviewsPath(), user.token)).status).toBe(404);
  });

  it("banned customers can't post or edit, but can delete their review", async () => {
    const user = await buyer();
    await api.put(reviewsPath(), { score: 5 }, user.token);
    await service.from("review_bans").insert({ user_id: user.id });

    expect((await api.get(`${reviewsPath()}/me`, user.token)).body.data.banned).toBe(true);
    const res = await api.put(reviewsPath(), { score: 1 }, user.token);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("You can no longer post reviews");
    expect((await api.delete(reviewsPath(), user.token)).status).toBe(200);
  });
});
