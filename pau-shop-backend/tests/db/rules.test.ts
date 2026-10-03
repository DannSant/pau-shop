import { beforeAll, describe, expect, it } from "vitest";
import { query, resetData } from "../helpers/db";
import { createAddress, createProduct, createReview, createUser, publicClientFor, TestUser } from "../helpers/factories";

// Rules enforced by the database itself (functions and permissions), checked
// directly rather than through the API.

let user: TestUser;

beforeAll(async () => {
  await resetData();
  user = await createUser();
});

const createOrder = (items: object[], addressId: string, userId = user.id) =>
  query("select create_order($1, $2, $3::jsonb) as id", [userId, addressId, JSON.stringify(items)]);

const errorOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return null;
  } catch (err: any) {
    return err.message as string;
  }
};

describe("create_order", () => {
  it.each([
    ["negative quantity", -1, "Invalid item quantity"],
    ["fractional quantity", 1.5, "Invalid item quantity"],
    ["quantity as text", "2", "Invalid order item"]
  ])("rejects a %s", async (_label, quantity, message) => {
    const product = await createProduct();
    const address = await createAddress(user.id);
    expect(await errorOf(createOrder([{ product_id: product.id, quantity }], address.id))).toBe(message);
  });

  it("rejects an empty order and another user's address", async () => {
    const product = await createProduct();
    const other = await createUser();
    const othersAddress = await createAddress(other.id);
    const address = await createAddress(user.id);

    expect(await errorOf(createOrder([], address.id))).toBe("Order must contain at least one item");
    expect(await errorOf(createOrder([{ product_id: product.id, quantity: 1 }], othersAddress.id))).toBe("Invalid shipping address");
  });

  it("never sells more than the stock, even with simultaneous orders", async () => {
    const product = await createProduct({ stock: 1 });
    const buyers = await Promise.all([createUser(), createUser(), createUser()]);
    const addresses = await Promise.all(buyers.map((b) => createAddress(b.id)));

    const results = await Promise.allSettled(
      buyers.map((b, i) => createOrder([{ product_id: product.id, quantity: 1 }], addresses[i].id, b.id))
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [{ stock }] = await query("select stock from products where id = $1", [product.id]);
    expect(stock).toBe(0);
  });
});

describe("cancel_pending_order", () => {
  it("cancels once, returning stock once; paid orders are untouched", async () => {
    const product = await createProduct({ stock: 5 });
    const address = await createAddress(user.id);
    const [{ id }] = await createOrder([{ product_id: product.id, quantity: 2 }], address.id);

    expect((await query("select cancel_pending_order($1) as r", [id]))[0].r).toBe(true);
    expect((await query("select cancel_pending_order($1) as r", [id]))[0].r).toBe(false);
    expect((await query("select stock from products where id = $1", [product.id]))[0].stock).toBe(5);

    const [{ id: paidId }] = await createOrder([{ product_id: product.id, quantity: 1 }], address.id);
    await query("update orders set status = 'paid' where id = $1", [paidId]);
    expect((await query("select cancel_pending_order($1) as r", [paidId]))[0].r).toBe(false);
  });
});

describe("the public key (what the website ships) can't write or read private data", () => {
  it("can't make itself admin, change prices or post reviews directly", async () => {
    const client = publicClientFor(user.token);
    const product = await createProduct({ price: 100 });

    const role = await client.from("user_data").update({ role: "admin" }).eq("id", user.id).select();
    expect(role.error?.code).toBe("42501");
    const price = await client.from("products").update({ price: 1 }).eq("id", product.id).select();
    expect(price.error?.code).toBe("42501");
    const review = await client.from("reviews").insert({ product_id: product.id, user_id: user.id, score: 1 });
    expect(review.error?.code).toBe("42501");

    const [row] = await query("select role from user_data where id = $1", [user.id]);
    expect(row.role).toBe("user");
  });

  it("can't read admin views, deleted reviews or bans, or call admin functions", async () => {
    const client = publicClientFor(user.token);
    for (const table of ["admin_user_review_summary", "admin_review_list", "deleted_reviews", "review_bans"]) {
      const { error } = await client.from(table).select("*").limit(1);
      expect(error?.code, table).toBe("42501");
    }
    const rpc = await client.rpc("cancel_pending_order", { p_order_id: "00000000-0000-0000-0000-000000000000" });
    expect(rpc.error?.code).toBe("42501");
  });

  it("can still read the public catalog and reviews", async () => {
    const product = await createProduct();
    await createReview(user.id, product.id);
    const client = publicClientFor();

    expect((await client.from("products").select("id").eq("id", product.id)).data).toHaveLength(1);
    expect((await client.from("reviews").select("id").eq("product_id", product.id)).data).toHaveLength(1);
  });
});
