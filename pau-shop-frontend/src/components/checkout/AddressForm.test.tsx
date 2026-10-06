import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { API, fail, ok, server } from "../../test/server";
import { renderPage, signedIn } from "../../test/render";
import AddressForm from "./AddressForm";

const delValle = { postal_code: "03100", state: "Ciudad de México", city: "Ciudad de México", neighborhoods: ["Del Valle Centro", "Insurgentes San Borja"] };
const juarez = { postal_code: "06600", state: "Ciudad de México", city: "Ciudad de México", neighborhoods: ["Juárez"] };

function lookups() {
  server.use(
    http.get(`${API}/postal-codes/:code`, ({ params }) => {
      if (params.code === "03100") return ok(delValle);
      if (params.code === "06600") return ok(juarez);
      return fail(404, "Postal code not found");
    })
  );
}

const renderForm = (initialAddress?: Parameters<typeof AddressForm>[0]["initialAddress"]) => {
  const onChange = vi.fn();
  const view = renderPage(<AddressForm initialAddress={initialAddress} onChange={onChange} />, { state: signedIn() as never });
  return { ...view, onChange, lastAddress: () => onChange.mock.calls.at(-1)?.[0] };
};

describe("AddressForm", () => {
  it("fills state, city and the only colonia from the postal code", async () => {
    lookups();
    const { user, lastAddress } = renderForm();

    await user.type(screen.getByPlaceholderText("Código postal"), "06600");

    await waitFor(() => expect(screen.getByPlaceholderText("Colonia")).toHaveValue("Juárez"));
    expect(screen.getByLabelText("Estado")).toHaveValue("Ciudad de México");
    expect(screen.getByLabelText("Estado")).toBeDisabled();
    expect(screen.getByPlaceholderText("Ciudad")).toHaveValue("Ciudad de México");
    expect(lastAddress()).toMatchObject({ postal_code: "06600", state: "Ciudad de México", neighborhood: "Juárez" });
  });

  it("suggests the colonias when there are several, and lets the customer type another", async () => {
    lookups();
    const { user, lastAddress } = renderForm();

    await user.type(screen.getByPlaceholderText("Código postal"), "03100");

    expect(await screen.findByText(/Elige tu colonia de la lista/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Colonia")).toHaveValue("");
    const options = [...document.querySelectorAll("#neighborhood-options option")].map((o) => o.getAttribute("value"));
    expect(options).toEqual(["Del Valle Centro", "Insurgentes San Borja"]);

    await user.type(screen.getByPlaceholderText("Colonia"), "Del Valle Sur");
    expect(lastAddress()).toMatchObject({ state: "Ciudad de México", city: "Ciudad de México", neighborhood: "Del Valle Sur" });
  });

  it("takes optional special instructions", async () => {
    const { user, lastAddress } = renderForm();

    await user.type(screen.getByLabelText(/Indicaciones especiales/), "Portón verde{Enter}Tocar dos veces");

    expect(lastAddress()).toMatchObject({ special_instructions: "Portón verde\nTocar dos veces" });
  });

  it("says when a postal code doesn't exist", async () => {
    lookups();
    const { user } = renderForm();

    await user.type(screen.getByPlaceholderText("Código postal"), "99999");

    expect(await screen.findByText(/No encontramos este código postal/)).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toBeEnabled();
  });

  it("keeps a saved address's city and colonia when editing it", async () => {
    lookups();
    renderForm({
      first_name: "Ana", last_name: "López", phone: "5551234567", street: "Reforma", exterior_number: "10",
      neighborhood: "Juárez Poniente", city: "CDMX", state: "CDMX", postal_code: "06600"
    });

    await waitFor(() => expect(screen.getByLabelText("Estado")).toHaveValue("Ciudad de México"));
    expect(screen.getByPlaceholderText("Colonia")).toHaveValue("Juárez Poniente");
    expect(screen.getByPlaceholderText("Ciudad")).toHaveValue("CDMX");
  });
});
