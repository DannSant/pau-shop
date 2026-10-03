import { describe, expect, it } from "vitest";
import { toCheckoutError } from "./checkoutSlice";

describe("toCheckoutError", () => {
  it.each([
    ["Insufficient stock", "outOfStock"],
    ["Product not found", "productUnavailable"],
    ["A phone number is required to place an order", "phoneRequired"],
    ["Invalid shipping address", "invalidAddress"],
    ["Request failed with status code 500", "generic"],
    ["", "generic"]
  ])("%s -> %s", (message, key) => {
    expect(toCheckoutError(message)).toBe(key);
  });
});
