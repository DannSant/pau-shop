import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createAddress, createOrder, createProduct, createUser, service, TestUser } from "../helpers/factories";
import { fakeStripeControl } from "../../src/lib/stripe.fake";

let admin: TestUser;
let customer: TestUser;
let other: TestUser;

beforeAll(async () => {
  await resetData();
  admin = await createUser({ role: "admin" });
  customer = await createUser();
  other = await createUser();
});

const stockOf = async (id: string) =>
  (await service.from("products").select("stock").eq("id", id).single()).data!.stock;

async function placeOrder(user: TestUser, items: { product_id: string; quantity: number }[]) {
  const address = await createAddress(user.id);
  return api.post("/orders", { shipping_address_id: address.id, items }, user.token);
}

describe("GET /orders/total/calculate", () => {
  it("adds taxes and shipping, rounded to cents", async () => {
    const res = await api.get("/orders/total/calculate?amount=25", customer.token);
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toEqual({ subtotal: 25, tax: 2.13, import_tax: 4, shipping_fee: 400, total: 431.13 });
  });

  it.each(["", "?amount=abc", "?amount=-5"])("rejects %s (400)", async (query) => {
    expect((await api.get(`/orders/total/calculate${query}`, customer.token)).status).toBe(400);
  });
});

describe("POST /orders", () => {
  it("creates the order, reserves stock and charges the right totals", async () => {
    const product = await createProduct({ price: 19.99, stock: 5 });
    const res = await placeOrder(customer, [{ product_id: product.id, quantity: 2 }]);

    expect(res.status).toBe(201);
    const { data: order } = await service.from("orders").select("*, order_items(*)").eq("id", res.body.data).single();
    expect(order).toMatchObject({ status: "pending", subtotal: 39.98, tax: 3.4, import_tax: 6.4, shipping_fee: 400, total_amount: 449.78 });
    expect(order!.order_items).toEqual([expect.objectContaining({ product_id: product.id, quantity: 2, unit_price: 19.99 })]);
    expect(await stockOf(product.id)).toBe(3);
  });

  it("uses the offer price when there is one", async () => {
    const product = await createProduct({ price: 100, offer_price: 80 });
    const res = await placeOrder(customer, [{ product_id: product.id, quantity: 1 }]);
    const { data } = await service.from("orders").select("subtotal").eq("id", res.body.data).single();
    expect(data!.subtotal).toBe(80);
  });

  it("merges repeated lines of the same product", async () => {
    const product = await createProduct({ stock: 5 });
    const res = await placeOrder(customer, [
      { product_id: product.id, quantity: 1 },
      { product_id: product.id, quantity: 2 }
    ]);
    const { data } = await service.from("order_items").select("quantity").eq("order_id", res.body.data);
    expect(data).toEqual([{ quantity: 3 }]);
  });

  it("needs a signed-in user (401)", async () => {
    expect((await api.post("/orders", {})).status).toBe(401);
  });

  it.each([
    ["no address", { items: [{ product_id: "x", quantity: 1 }] }, "shipping_address_id is required"],
    ["no items", { shipping_address_id: "a", items: [] }, "Order must contain at least one item"],
    ["a zero quantity", { shipping_address_id: "a", items: [{ product_id: "x", quantity: 0 }] }, "Each item needs a product_id and a positive whole quantity"],
    ["a fractional quantity", { shipping_address_id: "a", items: [{ product_id: "x", quantity: 1.5 }] }, "Each item needs a product_id and a positive whole quantity"]
  ])("rejects %s (400)", async (_label, body, message) => {
    const res = await api.post("/orders", body, customer.token);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  it("rejects customers without a phone (400)", async () => {
    const noPhone = await createUser({ phone: null });
    const product = await createProduct();
    const res = await placeOrder(noPhone, [{ product_id: product.id, quantity: 1 }]);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/phone/);
  });

  it("rejects more than the stock (400), leaving stock untouched", async () => {
    const product = await createProduct({ stock: 1 });
    const res = await placeOrder(customer, [{ product_id: product.id, quantity: 2 }]);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Insufficient stock");
    expect(await stockOf(product.id)).toBe(1);
  });

  it("rejects deleted and unknown products, and other users' addresses (400)", async () => {
    const deleted = await createProduct({ deleted_at: new Date().toISOString() });
    expect((await placeOrder(customer, [{ product_id: deleted.id, quantity: 1 }])).status).toBe(400);
    expect((await placeOrder(customer, [{ product_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }])).status).toBe(400);

    const product = await createProduct();
    const othersAddress = await createAddress(other.id);
    const res = await api.post("/orders", { shipping_address_id: othersAddress.id, items: [{ product_id: product.id, quantity: 1 }] }, customer.token);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid shipping address");
  });
});

describe("reading orders", () => {
  it("lists only the user's own orders, newest first, with item names", async () => {
    const user = await createUser();
    const product = await createProduct({ name: { es: "Llavero" } });
    await createOrder(user.id, product);
    await createOrder(other.id, product);

    const res = await api.get("/orders", user.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].order_items).toEqual([{ product_name: { es: "Llavero" }, quantity: 1 }]);
  });

  it("shows order details with item images; another user's order is 404", async () => {
    const product = await createProduct();
    const order = await createOrder(customer.id, product);

    const res = await api.get(`/orders/${order.id}`, customer.token);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([expect.objectContaining({ product_id: product.id, image_url: null })]);

    expect((await api.get(`/orders/${order.id}`, other.token)).status).toBe(404);
    expect((await api.get("/orders/not-an-id", customer.token)).status).toBe(404);
  });

  it("marks a pending order paid when Stripe says it was paid (no webhook yet)", async () => {
    const product = await createProduct({ price: 50 });
    const orderId = (await placeOrder(customer, [{ product_id: product.id, quantity: 1 }])).body.data;
    await api.post("/payments/create-checkout-session", { order_id: orderId }, customer.token);
    const { data } = await service.from("orders").select("stripe_session_id").eq("id", orderId).single();
    fakeStripeControl.complete(data!.stripe_session_id);

    const res = await api.get(`/orders/${orderId}`, customer.token);
    expect(res.body.data.status).toBe("paid");
  });
});

describe("admin orders", () => {
  it("lists every order with customer and address; filters by status", async () => {
    const product = await createProduct();
    const paid = await createOrder(customer.id, product, { status: "paid", shipping_status: "shipped" });
    await createOrder(other.id, product, { status: "pending" });

    expect((await api.get("/orders/admin", customer.token)).status).toBe(403);

    const all = await api.get("/orders/admin", admin.token);
    const row = all.body.data.find((o: any) => o.id === paid.id);
    expect(row.customer).toMatchObject({ id: customer.id, email: customer.email });
    expect(row.shipping_address.street).toBe("Calle Falsa");

    const shipped = await api.get("/orders/admin?shipping_status=shipped", admin.token);
    expect(shipped.body.data.every((o: any) => o.shipping_status === "shipped")).toBe(true);
    const pending = await api.get("/orders/admin?payment_status=pending", admin.token);
    expect(pending.body.data.every((o: any) => o.status === "pending")).toBe(true);
    expect((await api.get("/orders/admin?payment_status=refunded", admin.token)).status).toBe(400);
  });

  it("updates the shipping status of paid orders only", async () => {
    const product = await createProduct();
    const paid = await createOrder(customer.id, product, { status: "paid" });
    const unpaid = await createOrder(customer.id, product, { status: "pending" });

    const res = await api.patch(`/orders/${paid.id}/shipping-status`, { shipping_status: "arrived" }, admin.token);
    expect(res.status).toBe(200);
    expect(res.body.data.shipping_status).toBe("arrived");

    expect((await api.patch(`/orders/${unpaid.id}/shipping-status`, { shipping_status: "shipped" }, admin.token)).status).toBe(400);
    expect((await api.patch(`/orders/${unpaid.id}/shipping-status`, { shipping_status: "pending" }, admin.token)).status).toBe(200);
    expect((await api.patch(`/orders/${paid.id}/shipping-status`, { shipping_status: "lost" }, admin.token)).status).toBe(400);
    expect((await api.patch(`/orders/${paid.id}/shipping-status`, { shipping_status: "shipped" }, customer.token)).status).toBe(403);
    expect((await api.patch("/orders/00000000-0000-0000-0000-000000000000/shipping-status", { shipping_status: "shipped" }, admin.token)).status).toBe(404);
  });
});
