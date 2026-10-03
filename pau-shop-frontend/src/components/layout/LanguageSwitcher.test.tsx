import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSwitcher from "./LanguageSwitcher";

const reload = vi.fn();
const originalLocation = window.location;

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

describe("LanguageSwitcher", () => {
  it("marks Spanish as active and switches to English by saving the choice and reloading", async () => {
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, reload } });
    render(<LanguageSwitcher />);

    expect(screen.getByRole("button", { name: "ES" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(localStorage.getItem("language")).toBe("en");
    expect(reload).toHaveBeenCalled();
  });

  it("does nothing when the current language is chosen again", async () => {
    Object.defineProperty(window, "location", { configurable: true, value: { ...originalLocation, reload } });
    reload.mockClear();
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole("button", { name: "ES" }));
    expect(reload).not.toHaveBeenCalled();
  });
});
