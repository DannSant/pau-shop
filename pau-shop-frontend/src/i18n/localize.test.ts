import { describe, expect, it } from "vitest";
import { localize } from ".";

describe("localize", () => {
  it("uses the current language (Spanish by default)", () => {
    expect(localize({ es: "Taza", en: "Mug" })).toBe("Taza");
  });

  it("handles missing text", () => {
    expect(localize(null)).toBe("");
    expect(localize(undefined)).toBe("");
  });
});
