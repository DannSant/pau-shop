import { describe, expect, it } from "vitest";
import { authDestination, clearRememberedNext, rememberNext } from "./authRedirect";

describe("authDestination", () => {
  it("prefers the page the user came from", () => {
    rememberNext("/profile");
    expect(authDestination("/checkout", true)).toBe("/checkout");
  });

  it("then the page remembered before going to Google", () => {
    rememberNext("/profile");
    expect(authDestination(undefined, true)).toBe("/profile");
  });

  it("otherwise the cart (if it has items) or home", () => {
    expect(authDestination(undefined, false)).toBe("/cart");
    expect(authDestination(undefined, true)).toBe("/");
  });

  it("never sends users to another site or back to a sign-in page", () => {
    expect(authDestination("//evil.example.com", true)).toBe("/");
    expect(authDestination("https://evil.example.com", true)).toBe("/");
    expect(authDestination("/login?x=1", true)).toBe("/");
    rememberNext("/signup");
    expect(authDestination(undefined, true)).toBe("/");
  });

  it("forgets the remembered page once cleared", () => {
    rememberNext("/profile");
    clearRememberedNext();
    expect(authDestination(undefined, true)).toBe("/");
  });
});
