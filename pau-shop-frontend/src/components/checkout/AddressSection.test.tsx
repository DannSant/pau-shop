import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { http } from "msw";
import { API, fail, ok, server } from "../../test/server";
import { renderPage, signedIn } from "../../test/render";
import AddressSection from "./AddressSection";

describe("AddressSection", () => {
  it("shows an error when the backend rejects a new address", async () => {
    server.use(
      http.get(`${API}/addresses`, () => ok([])),
      http.post(`${API}/addresses`, () => fail(400, "street is required"))
    );
    const { user } = renderPage(<AddressSection />, { state: signedIn() as never });

    await user.click(await screen.findByRole("button", { name: "Agregar nueva dirección" }));
    await user.type(screen.getByPlaceholderText("Calle"), "Solo calle");
    await user.click(screen.getByRole("button", { name: "Usar esta dirección" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("todos los campos son obligatorios");
  });

  it("confirms an existing address", async () => {
    server.use(
      http.get(`${API}/addresses`, () =>
        ok([{ id: "a1", first_name: "Ana", last_name: "López", phone: "5551234567", street: "Reforma", exterior_number: "10", neighborhood: "Juárez", city: "CDMX", state: "Ciudad de México", postal_code: "06600" }])
      )
    );
    const { user, store } = renderPage(<AddressSection />, { state: signedIn() as never });

    await screen.findByText("Reforma 10");
    await user.click(screen.getByRole("button", { name: "Usar esta dirección" }));

    expect(await screen.findByRole("button", { name: "Usar otra dirección" })).toBeInTheDocument();
    expect(store.getState().checkout).toMatchObject({ addressConfirmed: true, address: { id: "a1" } });
  });
});
