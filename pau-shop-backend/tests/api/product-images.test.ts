import { beforeAll, describe, expect, it } from "vitest";
import { api, app } from "../helpers/api";
import request from "supertest";
import { resetData } from "../helpers/db";
import { createProduct, createUser, service, TestUser } from "../helpers/factories";
import { BUCKET } from "../../src/modules/product-images/product-images.service";

// 1×1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

let admin: TestUser;
let customer: TestUser;

beforeAll(async () => {
  await resetData();
  admin = await createUser({ role: "admin" });
  customer = await createUser();
});

const upload = (productId: string, files: { name: string; type: string; data: Buffer }[], token = admin.token) => {
  let req = request(app).post(`/api/products/${productId}/images`).set("Authorization", `Bearer ${token}`);
  for (const file of files) req = req.attach("images", file.data, { filename: file.name, contentType: file.type });
  return req;
};
const png = (name = "a.png") => ({ name, type: "image/png", data: PNG });

const storedFiles = async (productId: string) => {
  const { data } = await service.storage.from(BUCKET).list(productId);
  return data ?? [];
};

describe("product images", () => {
  it("uploads images; the first becomes the main image", async () => {
    const product = await createProduct();
    const res = await upload(product.id, [png("a.png"), png("b.png")]);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((i: any) => i.is_thumbnail)).toEqual([true, false]);
    expect(res.body.data[0].url).toContain(`/storage/v1/object/public/${BUCKET}/${product.id}/`);
    expect(await storedFiles(product.id)).toHaveLength(2);

    const list = await api.get(`/products/${product.id}/images`);
    expect(list.body.data).toHaveLength(2);
  });

  it("only admins can upload (401/403)", async () => {
    const product = await createProduct();
    expect((await request(app).post(`/api/products/${product.id}/images`).attach("images", PNG, "a.png")).status).toBe(401);
    expect((await upload(product.id, [png()], customer.token)).status).toBe(403);
  });

  it("rejects files that aren't images (400)", async () => {
    const product = await createProduct();
    const res = await upload(product.id, [{ name: "a.txt", type: "text/plain", data: Buffer.from("hola") }]);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPG, PNG/);
  });

  it("rejects images over 5 MB (400)", async () => {
    const product = await createProduct();
    const res = await upload(product.id, [{ name: "big.png", type: "image/png", data: Buffer.alloc(5 * 1024 * 1024 + 1) }]);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/5 MB/);
  });

  it("rejects more than 10 images at once (400)", async () => {
    const product = await createProduct();
    const res = await upload(product.id, Array.from({ length: 11 }, (_, i) => png(`${i}.png`)));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at most 10/);
  });

  it("rejects an upload with no files (400) and unknown products (404)", async () => {
    const product = await createProduct();
    expect((await upload(product.id, [])).status).toBe(400);
    expect((await upload("00000000-0000-0000-0000-000000000000", [png()])).status).toBe(404);
  });

  it("changes the main image", async () => {
    const product = await createProduct();
    const [, second] = (await upload(product.id, [png("a.png"), png("b.png")])).body.data;

    const res = await api.patch(`/products/${product.id}/images/${second.id}`, {}, admin.token);

    expect(res.status).toBe(200);
    const list = (await api.get(`/products/${product.id}/images`)).body.data;
    expect(list.filter((i: any) => i.is_thumbnail).map((i: any) => i.id)).toEqual([second.id]);
  });

  it("deletes an image and its file; the next image becomes the main one", async () => {
    const product = await createProduct();
    const [first, second] = (await upload(product.id, [png("a.png"), png("b.png")])).body.data;

    const res = await api.delete(`/products/${product.id}/images/${first.id}`, admin.token);

    expect(res.status).toBe(200);
    expect(await storedFiles(product.id)).toHaveLength(1);
    const list = (await api.get(`/products/${product.id}/images`)).body.data;
    expect(list).toEqual([expect.objectContaining({ id: second.id, is_thumbnail: true })]);
  });

  it("returns 404 for an image of another product", async () => {
    const a = await createProduct();
    const b = await createProduct();
    const [image] = (await upload(a.id, [png()])).body.data;

    expect((await api.delete(`/products/${b.id}/images/${image.id}`, admin.token)).status).toBe(404);
    expect((await api.patch(`/products/${b.id}/images/${image.id}`, {}, admin.token)).status).toBe(404);
  });
});
