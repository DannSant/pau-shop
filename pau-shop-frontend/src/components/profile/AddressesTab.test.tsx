import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { http } from "msw";
import { API, fail, ok, server } from "../../test/server";
import { renderPage, signedIn } from "../../test/render";
import AddressesTab from "./AddressesTab";

const saved = {
  id: "a1", first_name: "Ana", last_name: "López", phone: "5551234567", street: "Reforma", exterior_number: "10",
  interior_number: null, neighborhood: "Juárez", city: "Ciudad de México", state: "Ciudad de México",
  postal_code: "06600", special_instructions: "Portón verde", created_at: "2026-10-01T00:00:00Z"
};

const renderTab = () => renderPage(<AddressesTab />, { state: signedIn() as never });

afterEach(() => vi.restoreAllMocks());

describe("AddressesTab", () => {
  it("lists the saved addresses with their special instructions", async () => {
    server.use(http.get(`${API}/addresses`, () => ok([saved])));
    renderTab();

    expect(await screen.findByText("Reforma 10")).toBeInTheDocument();
    expect(screen.getByText("Portón verde")).toBeInTheDocument();
  });

  it("adds a new address", async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.get(`${API}/addresses`, () => ok([])),
      http.get(`${API}/postal-codes/:code`, () =>
        ok({ postal_code: "06600", state: "Ciudad de México", city: "Ciudad de México", neighborhoods: ["Juárez"] })
      ),
      http.post(`${API}/addresses`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return ok({ ...sent, id: "a2", created_at: "2026-10-06T00:00:00Z" }, 201);
      })
    );
    const { user } = renderTab();

    expect(await screen.findByText("Aún no tienes direcciones guardadas.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar dirección" }));
    await user.type(screen.getByPlaceholderText("Nombre"), "Ana");
    await user.type(screen.getByPlaceholderText("Apellido"), "López");
    await user.type(screen.getByPlaceholderText("Calle"), "Reforma");
    await user.type(screen.getByPlaceholderText("Número exterior"), "10");
    await user.type(screen.getByPlaceholderText("Código postal"), "06600");
    await screen.findByDisplayValue("Juárez");
    await user.type(screen.getByPlaceholderText("Teléfono"), "5551234567");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Reforma 10")).toBeInTheDocument();
    expect(sent).toMatchObject({ street: "Reforma", postal_code: "06600", state: "Ciudad de México", neighborhood: "Juárez" });
  });

  it("explains that an address used in an order can't be deleted", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(
      http.get(`${API}/addresses`, () => ok([saved])),
      http.delete(`${API}/addresses/a1`, () => fail(409, "This address is used by an order"))
    );
    const { user } = renderTab();

    await screen.findByText("Reforma 10");
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText(/se usó en un pedido/)).toBeInTheDocument();
    expect(screen.getByText("Reforma 10")).toBeInTheDocument();
  });

  it("deletes an address", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(
      http.get(`${API}/addresses`, () => ok([saved])),
      http.delete(`${API}/addresses/a1`, () => ok({}))
    );
    const { user } = renderTab();

    const card = (await screen.findByText("Reforma 10")).parentElement!;
    await user.click(within(card).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Aún no tienes direcciones guardadas.")).toBeInTheDocument();
  });
});
