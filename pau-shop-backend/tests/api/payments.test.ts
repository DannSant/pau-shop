import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { api, sendWebhook } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createAddress, createProduct, createUser, service, TestUser } from "../helpers/factories";
import { fakeStripeControl } from "../../src/lib/stripe.fake";
import { reconcileStaleOrders } from "../../src/modules/payments/payments.service";

let customer: TestUser;
let other: TestUser;
let product: { id: string; name: object; price: number };

beforeAll(async () => {
  await resetData();
  customer = await createUser();
  other = await createUser();
});

beforeEach(async () => {
  product = await createProduct({ name: { es: "Taza", en: "Mug" }, price: 19.99, stock: 5 });
});

const stock = async () => (await service.from("products").select("stock").eq("id", product.id).single()).data!.stock;
const orderRow = async (id: string) => (await service.from("orders").select("*").eq("id", id).single()).data!;

async function newOrder(user = customer, quantity = 2) {
  const address = await createAddress(user.id);
  const res = await api.post("/orders", { shipping_address_id: address.id, items: [{ product_id: product.id, quantity }] }, user.token);
  expect(res.status).toBe(201);
  return res.body.data as string;
}

async function startPayment(orderId: string, language = "es", user = customer) {
  const res = await api.post("/payments/create-checkout-session", { order_id: orderId, language }, user.token);
  const sessionId = (await orderRow(orderId)).stripe_session_id;
  return { res, session: fakeStripeControl.get(sessionId)! };
}

describe("POST /payments/create-checkout-session", () => {
  it("charges the full order total: products, both taxes and shipping", async () => {
    const orderId = await newOrder();
    const { res, session } = await startPayment(orderId);

    expect(res.status).toBe(200);
    expect(res.body.data.checkout_url).toBe(session.url);
    expect(session.line_items.map((l) => [l.description, l.amount_total])).toEqual([
      ["Taza", 3998],
      ["Impuesto de California (8.5%)", 340],
      ["Impuesto de importación (16%)", 640],
      ["Envío", 40000]
    ]);
    expect(session.amount_total).toBe(Math.round((await orderRow(orderId)).total_amount * 100));
    expect(session.locale).toBe("es-419");
    expect(session.metadata).toMatchObject({ order_id: orderId, user_id: customer.id });
    expect(session.cancel_url).toMatch(new RegExp(`/checkout\\?cancelled_order=${orderId}$`));
    const minutes = (session.expires_at - session.created) / 60;
    expect(minutes).toBeGreaterThanOrEqual(30);
    expect(minutes).toBeLessThanOrEqual(32);
  });

  it("uses English names and Stripe page when asked", async () => {
    const { session } = await startPayment(await newOrder(), "en");
    expect(session.locale).toBe("en");
    expect(session.line_items.map((l) => l.description)).toEqual(["Mug", "California tax (8.5%)", "Import tax (16%)", "Shipping"]);
  });

  it("reuses the open payment page instead of creating a second one", async () => {
    const orderId = await newOrder();
    const first = await startPayment(orderId);
    const second = await startPayment(orderId);
    expect(second.res.body.data.checkout_url).toBe(first.res.body.data.checkout_url);
  });

  it("refuses orders that aren't pending (409), other users' orders and bad ids (404)", async () => {
    const orderId = await newOrder();
    await service.from("orders").update({ status: "paid" }).eq("id", orderId);
    expect((await startPayment(orderId)).res.status).toBe(409);

    const othersOrder = await newOrder(other);
    expect((await api.post("/payments/create-checkout-session", { order_id: othersOrder }, customer.token)).status).toBe(404);
    expect((await api.post("/payments/create-checkout-session", { order_id: "nope" }, customer.token)).status).toBe(404);
    expect((await api.post("/payments/create-checkout-session", { order_id: orderId })).status).toBe(401);
  });
});

describe("POST /payments/cancel (back from Stripe without paying)", () => {
  it("cancels the order, returns the stock and closes the payment page", async () => {
    const orderId = await newOrder();
    const { session } = await startPayment(orderId);
    expect(await stock()).toBe(3);

    const res = await api.post("/payments/cancel", { order_id: orderId }, customer.token);

    expect(res.body.data).toEqual({ status: "cancelled" });
    expect(await stock()).toBe(5);
    expect(fakeStripeControl.get(session.id)!.status).toBe("expired");
    expect((await orderRow(orderId)).cancelled_at).not.toBeNull();
  });

  it("never returns stock twice", async () => {
    const orderId = await newOrder();
    await api.post("/payments/cancel", { order_id: orderId }, customer.token);
    const again = await api.post("/payments/cancel", { order_id: orderId }, customer.token);
    expect(again.body.data.status).toBe("cancelled");
    expect(await stock()).toBe(5);
  });

  it("keeps the order if it was paid in the meantime", async () => {
    const orderId = await newOrder();
    const { session } = await startPayment(orderId);
    fakeStripeControl.complete(session.id);

    const res = await api.post("/payments/cancel", { order_id: orderId }, customer.token);
    expect(res.body.data.status).toBe("paid");
    expect(await stock()).toBe(3);
  });

  it("can't cancel another user's order (404)", async () => {
    const orderId = await newOrder(other);
    expect((await api.post("/payments/cancel", { order_id: orderId }, customer.token)).status).toBe(404);
    expect((await orderRow(orderId)).status).toBe("pending");
  });

  it("a new order cancels the customer's earlier unpaid one", async () => {
    const first = await newOrder();
    await startPayment(first);
    await newOrder();

    expect((await orderRow(first)).status).toBe("cancelled");
    expect(await stock()).toBe(3);
  });
});

describe("Stripe webhook", () => {
  const sessionFor = async (orderId: string, overrides: object = {}) => {
    const order = await orderRow(orderId);
    return {
      id: "cs_test_webhook",
      object: "checkout.session",
      status: "complete",
      payment_status: "paid",
      currency: "mxn",
      amount_total: Math.round(order.total_amount * 100),
      metadata: { order_id: orderId },
      ...overrides
    };
  };

  it("rejects a bad signature (400)", async () => {
    const res = await sendWebhook("checkout.session.completed", {}, "whsec_wrong");
    expect(res.status).toBe(400);
  });

  it("marks the order paid when the full amount was paid", async () => {
    const orderId = await newOrder();
    const res = await sendWebhook("checkout.session.completed", await sessionFor(orderId));

    expect(res.status).toBe(200);
    const order = await orderRow(orderId);
    expect(order.status).toBe("paid");
    expect(order.paid_at).not.toBeNull();
  });

  it("ignores repeated events", async () => {
    const orderId = await newOrder();
    await sendWebhook("checkout.session.completed", await sessionFor(orderId));
    const paidAt = (await orderRow(orderId)).paid_at;
    await sendWebhook("checkout.session.completed", await sessionFor(orderId));
    expect((await orderRow(orderId)).paid_at).toBe(paidAt);
  });

  it("doesn't mark paid when the payment is still pending or the amount is wrong", async () => {
    const orderId = await newOrder();
    await sendWebhook("checkout.session.completed", await sessionFor(orderId, { payment_status: "unpaid" }));
    expect((await orderRow(orderId)).status).toBe("pending");

    const cents = (await sessionFor(orderId)).amount_total;
    await sendWebhook("checkout.session.completed", await sessionFor(orderId, { amount_total: cents - 100 }));
    expect((await orderRow(orderId)).status).toBe("pending");
  });

  it("delayed payment succeeded marks it paid; failed cancels and returns stock", async () => {
    const paid = await newOrder(customer, 1);
    await sendWebhook("checkout.session.async_payment_succeeded", await sessionFor(paid));
    expect((await orderRow(paid)).status).toBe("paid");

    const failedUser = await createUser();
    const failed = await newOrder(failedUser, 1);
    const before = await stock();
    await sendWebhook("checkout.session.async_payment_failed", await sessionFor(failed, { payment_status: "unpaid" }));
    expect((await orderRow(failed)).status).toBe("cancelled");
    expect(await stock()).toBe(before + 1);
  });

  it("expired page cancels an unpaid order but never a paid one", async () => {
    const orderId = await newOrder();
    await sendWebhook("checkout.session.expired", await sessionFor(orderId, { status: "expired", payment_status: "unpaid" }));
    expect((await orderRow(orderId)).status).toBe("cancelled");
    expect(await stock()).toBe(5);

    const paidId = await newOrder();
    await sendWebhook("checkout.session.completed", await sessionFor(paidId));
    await sendWebhook("checkout.session.expired", await sessionFor(paidId, { status: "expired" }));
    expect((await orderRow(paidId)).status).toBe("paid");
  });
});

describe("reconcileStaleOrders (missed webhooks)", () => {
  const makeOld = (orderId: string) =>
    service.from("orders").update({ created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }).eq("id", orderId);

  it("cancels old unpaid orders and marks paid the ones Stripe says were paid", async () => {
    const abandonedUser = await createUser();
    const paidUser = await createUser();

    const abandoned = await newOrder(abandonedUser, 1);
    fakeStripeControl.expire((await startPayment(abandoned, "es", abandonedUser)).session.id);
    const paid = await newOrder(paidUser, 1);
    fakeStripeControl.complete((await startPayment(paid, "es", paidUser)).session.id);
    const recent = await newOrder(customer, 1);

    await makeOld(abandoned);
    await makeOld(paid);
    await reconcileStaleOrders();

    expect((await orderRow(abandoned)).status).toBe("cancelled");
    expect((await orderRow(paid)).status).toBe("paid");
    expect((await orderRow(recent)).status).toBe("pending");
  });
});
