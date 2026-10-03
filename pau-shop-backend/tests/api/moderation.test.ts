import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createProduct, createReview, createUser, service, TestUser } from "../helpers/factories";

let admin: TestUser;
let customer: TestUser;

beforeAll(async () => {
  await resetData();
  admin = await createUser({ role: "admin", name: "Ana Admin" });
  customer = await createUser();
});

describe("access", () => {
  it("is admin only (401/403)", async () => {
    expect((await api.get("/moderation/reviews")).status).toBe(401);
    expect((await api.get("/moderation/reviews", customer.token)).status).toBe(403);
    expect((await api.get("/moderation/users", customer.token)).status).toBe(403);
  });
});

describe("reviews", () => {
  it("lists reviews newest first with product, author and email", async () => {
    const p = await createProduct({ name: { es: "Póster" } });
    const author = await createUser({ name: "Toño" });
    await createReview(author.id, p.id, { created_at: "2026-01-01T00:00:00Z" });
    const newer = await createReview(customer.id, p.id);

    const res = await api.get("/moderation/reviews", admin.token);

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].id).toBe(newer.id);
    expect(res.body.data.items.find((r: any) => r.user_id === author.id)).toMatchObject({
      product_name: { es: "Póster" },
      user_name: "Toño",
      user_email: author.email,
      user_banned: false
    });
  });

  it("pages through results", async () => {
    const p = await createProduct();
    for (let i = 0; i < 52; i++) {
      const u = await createUser();
      await createReview(u.id, p.id);
    }
    const first = await api.get("/moderation/reviews", admin.token);
    expect(first.body.data.items).toHaveLength(50);
    expect(first.body.data.hasMore).toBe(true);

    const rest = await api.get("/moderation/reviews?offset=50", admin.token);
    expect(rest.body.data.hasMore).toBe(false);
  });

  it("deletes a review, keeps a copy and updates the average", async () => {
    const p = await createProduct({ name: { es: "Taza" } });
    const troll = await createUser();
    const fan = await createUser();
    const bad = await createReview(troll.id, p.id, { score: 1, comment: "Basura" });
    await createReview(fan.id, p.id, { score: 5 });

    const res = await api.delete(`/moderation/reviews/${bad.id}`, admin.token);

    expect(res.status).toBe(200);
    expect((await api.get(`/products/${p.id}/reviews`)).body.data).toMatchObject({ average: 5, count: 1 });
    const { data: log } = await service.from("deleted_reviews").select("*").eq("review_id", bad.id).single();
    expect(log).toMatchObject({ user_id: troll.id, comment: "Basura", score: 1, deleted_by: admin.id, product_name: { es: "Taza" } });

    expect((await api.delete(`/moderation/reviews/${bad.id}`, admin.token)).status).toBe(404);
    expect((await api.delete("/moderation/reviews/nope", admin.token)).status).toBe(404);
  });
});

describe("users", () => {
  it("sorts by deleted reviews, then reviews; searches name and email", async () => {
    const p1 = await createProduct();
    const p2 = await createProduct();
    const troll = await createUser({ name: "Zeta Troll" });
    const fan = await createUser({ name: "Zeta Fan" });
    const r = await createReview(troll.id, p1.id);
    await createReview(fan.id, p1.id);
    await createReview(fan.id, p2.id);
    await api.delete(`/moderation/reviews/${r.id}`, admin.token);

    const res = await api.get("/moderation/users?search=zeta", admin.token);

    expect(res.body.data.items.map((u: any) => [u.name, u.deleted_review_count, u.review_count])).toEqual([
      ["Zeta Troll", 1, 0],
      ["Zeta Fan", 0, 2]
    ]);
    expect((await api.get(`/moderation/users?search=${encodeURIComponent(fan.email)}`, admin.token)).body.data.items).toHaveLength(1);
    expect((await api.get(`/moderation/users?search=${encodeURIComponent('a,b(c)"%*:')}`, admin.token)).status).toBe(200);
  });

  it("shows a user's reviews, deleted history and ban", async () => {
    const p = await createProduct();
    const user = await createUser({ name: "Detalle" });
    const r = await createReview(user.id, p.id, { comment: "uno" });
    await api.delete(`/moderation/reviews/${r.id}`, admin.token);
    await createReview(user.id, (await createProduct()).id, { comment: "dos" });
    await api.put(`/moderation/users/${user.id}/ban`, { note: "spam" }, admin.token);

    const res = await api.get(`/moderation/users/${user.id}`, admin.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ banned_by_name: "Ana Admin", user: { ban_note: "spam", deleted_review_count: 1, review_count: 1 } });
    expect(res.body.data.reviews.map((x: any) => x.comment)).toEqual(["dos"]);
    expect(res.body.data.deleted).toEqual([expect.objectContaining({ comment: "uno", deleted_by_name: "Ana Admin" })]);
    expect((await api.get("/moderation/users/00000000-0000-0000-0000-000000000000", admin.token)).status).toBe(404);
  });

  it("deletes all of a user's reviews", async () => {
    const user = await createUser();
    await createReview(user.id, (await createProduct()).id);
    await createReview(user.id, (await createProduct()).id);

    const res = await api.delete(`/moderation/users/${user.id}/reviews`, admin.token);

    expect(res.body.data).toEqual({ deleted: 2 });
    const { count } = await service.from("deleted_reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id);
    expect(count).toBe(2);
  });

  it("bans and unbans; banning again only updates the note", async () => {
    const user = await createUser();
    const banned = await api.put(`/moderation/users/${user.id}/ban`, { note: "  ofensivo  " }, admin.token);
    expect(banned.status).toBe(200);
    expect(banned.body.data).toMatchObject({ ban_note: "ofensivo" });

    const again = await api.put(`/moderation/users/${user.id}/ban`, { note: "reincidente" }, admin.token);
    expect(again.body.data).toMatchObject({ ban_note: "reincidente", banned_at: banned.body.data.banned_at });

    const lifted = await api.delete(`/moderation/users/${user.id}/ban`, admin.token);
    expect(lifted.body.data.banned_at).toBeNull();
  });

  it.each([
    ["themselves", () => admin.id, {}, 400],
    ["an admin", async () => (await createUser({ role: "admin" })).id, {}, 400],
    ["with a note over 500 characters", () => customer.id, { note: "x".repeat(501) }, 400],
    ["an unknown user", () => "00000000-0000-0000-0000-000000000000", {}, 404]
  ])("can't ban %s", async (_label, target, body, status) => {
    const id = await (target as () => string | Promise<string>)();
    expect((await api.put(`/moderation/users/${id}/ban`, body, admin.token)).status).toBe(status);
  });
});
