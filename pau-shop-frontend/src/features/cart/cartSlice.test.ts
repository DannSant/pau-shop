import { describe, expect, it } from "vitest";
import { loadCart, saveCart } from "./cartSlice";

const item = { product_id: "p1", name: { es: "Taza" }, price: 20, quantity: 2 };

describe("saved cart", () => {
  it("round-trips through localStorage", () => {
    saveCart([item]);
    expect(loadCart()).toEqual([item]);
  });

  it("starts empty when nothing is saved or the data is corrupted", () => {
    expect(loadCart()).toEqual([]);
    localStorage.setItem("cart", "{not json");
    expect(loadCart()).toEqual([]);
  });

  it("drops malformed items", () => {
    localStorage.setItem("cart", JSON.stringify([item, { product_id: "p2" }, { ...item, product_id: "p3", quantity: -1 }]));
    expect(loadCart().map((i) => i.product_id)).toEqual(["p1"]);
  });
});
