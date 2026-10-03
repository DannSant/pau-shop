import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { API, fail, ok, server } from "../../test/server";
import { renderPage, signedIn } from "../../test/render";
import CheckoutPage from "./CheckoutPage";

const address = {
  id: "a1", user_id: "user-1", first_name: "Ana", last_name: "López", phone: "5551234567",
  street: "Reforma", exterior_number: "10", interior_number: null, neighborhood: "Juárez",
  city: "CDMX", state: "CDMX", postal_code: "06600"
};

const cart = { cart: { items: [{ product_id: "p1", name: { es: "Taza" }, price: 25, quantity: 1 }] } };

function backend(overrides: Parameters<typeof server.use> = []) {
  server.use(
    http.get(`${API}/addresses`, () => ok([address])),
    http.get(`${API}/orders/total/calculate`, () => ok([{ subtotal: 25, tax: 2.13, import_tax: 4, shipping_fee: 400, total: 431.13 }])),
    ...overrides
  );
}

const renderCheckout = (route = "/checkout") =>
  renderPage(<CheckoutPage />, { route, path: "/checkout", state: { ...signedIn(), ...cart } as never });

describe("CheckoutPage", () => {
  it("shows the totals from the backend", async () => {
    backend();
    renderCheckout();
    expect(await screen.findByText("$431.13")).toBeInTheDocument();
    expect(screen.getByText("$2.13")).toBeInTheDocument();
  });

  it("asks for an address before paying", async () => {
    backend();
    const { user } = renderCheckout();
    await user.click(await screen.findByRole("button", { name: "Pagar ahora" }));
    expect(screen.getAllByText("Selecciona una dirección primero").length).toBeGreaterThan(0);
  });

  it("explains when a product ran out of stock", async () => {
    backend([http.post(`${API}/orders`, () => fail(400, "Insufficient stock"))]);
    const { user } = renderCheckout();

    await screen.findByText("Reforma 10");
    await user.click(screen.getByRole("button", { name: "Usar esta dirección" }));
    await user.click(screen.getByRole("button", { name: "Pagar ahora" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Uno de los productos ya no tiene suficientes existencias");
    expect(screen.getByRole("button", { name: "Pagar ahora" })).toBeEnabled();
  });

  it("coming back from Stripe without paying releases the order and says so", async () => {
    let cancelled: unknown;
    backend([
      http.post(`${API}/payments/cancel`, async ({ request }) => {
        cancelled = await request.json();
        return ok({ status: "cancelled" });
      })
    ]);
    renderCheckout("/checkout?cancelled_order=00000000-0000-0000-0000-000000000001");

    expect(await screen.findByText(/El pago no se completó/)).toBeInTheDocument();
    await waitFor(() => expect(cancelled).toEqual({ order_id: "00000000-0000-0000-0000-000000000001" }));
  });

  it("an empty cart goes back to the cart page", async () => {
    backend();
    renderPage(<CheckoutPage />, { route: "/checkout", path: "/checkout", state: signedIn() as never });
    expect(await screen.findByTestId("location")).toHaveTextContent("/cart");
  });
});
