import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createAddress, createOrder, createProduct, createUser, service, TestUser } from "../helpers/factories";

let ana: TestUser;
let beto: TestUser;

beforeAll(async () => {
  await resetData();
  ana = await createUser({ name: "Ana" });
  beto = await createUser({ name: "Beto" });
});

const newAddress = (overrides: object = {}) => ({
  first_name: "Ana",
  last_name: "López",
  phone: "55 1234 5678",
  street: "Av. Reforma",
  exterior_number: "10",
  interior_number: "4B",
  neighborhood: "Juárez",
  city: "CDMX",
  state: "Ciudad de México",
  postal_code: "06600",
  special_instructions: "Portón verde, tocar dos veces",
  ...overrides
});

describe("addresses", () => {
  it("needs a signed-in user (401)", async () => {
    expect((await api.get("/addresses")).status).toBe(401);
    expect((await api.post("/addresses", newAddress())).status).toBe(401);
  });

  it("creates an address for the signed-in user, ignoring user_id and id in the body", async () => {
    const res = await api.post("/addresses", newAddress({ user_id: beto.id, id: "x" }), ana.token);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      user_id: ana.id, street: "Av. Reforma", interior_number: "4B", special_instructions: "Portón verde, tocar dos veces"
    });
  });

  it.each([
    ["a missing street", { street: undefined }, "street is required"],
    ["a blank city", { city: "   " }, "city is required"],
    ["an invalid phone", { phone: "abc" }, "Invalid phone number"],
    ["a field that is too long", { neighborhood: "x".repeat(201) }, "neighborhood is too long"],
    ["a state outside Mexico", { state: "Texas" }, "state must be a Mexican state"],
    ["a postal code that isn't 5 digits", { postal_code: "6600" }, "postal_code must be 5 digits"],
    ["special instructions that are too long", { special_instructions: "x".repeat(501) }, "special_instructions is too long"],
    ["a non-numeric postal code", { postal_code: "SW1A1" }, "postal_code must be 5 digits"],
    ["a postal code that doesn't exist", { postal_code: "99999" }, "Unknown postal code"],
    ["a postal code from another state", { postal_code: "44100" }, "state doesn't match the postal code"]
  ])("rejects %s (400)", async (_label, overrides, message) => {
    const res = await api.post("/addresses", newAddress(overrides), ana.token);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });

  it("lists only the user's own addresses, newest first", async () => {
    await createAddress(beto.id, { street: "Calle de Beto" });
    const res = await api.get("/addresses", ana.token);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((a: any) => a.user_id === ana.id)).toBe(true);
  });

  it("updates own address fields, but never moves it to another user", async () => {
    const address = await createAddress(ana.id);
    const res = await api.put(`/addresses/${address.id}`, { city: "Puebla", user_id: beto.id }, ana.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ city: "Puebla", user_id: ana.id, street: address.street });
  });

  it("clears the optional fields when they're sent blank", async () => {
    const address = await createAddress(ana.id, { interior_number: "4B", special_instructions: "Portón verde" });
    const res = await api.put(`/addresses/${address.id}`, { interior_number: "", special_instructions: "  " }, ana.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ interior_number: null, special_instructions: null });
  });

  it("won't change the postal code without the state (400)", async () => {
    const address = await createAddress(ana.id);
    const res = await api.put(`/addresses/${address.id}`, { postal_code: "06600" }, ana.token);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("postal_code and state must be sent together");
  });

  it("returns 404 when updating or deleting someone else's address", async () => {
    const betos = await createAddress(beto.id);

    expect((await api.put(`/addresses/${betos.id}`, { city: "Hackeado" }, ana.token)).status).toBe(404);
    expect((await api.delete(`/addresses/${betos.id}`, ana.token)).status).toBe(404);

    const { data } = await service.from("shipping_addresses").select("city").eq("id", betos.id).single();
    expect(data!.city).toBe("CDMX");
  });

  it("returns 404 for unknown or malformed ids", async () => {
    expect((await api.put("/addresses/00000000-0000-0000-0000-000000000000", { city: "X" }, ana.token)).status).toBe(404);
    expect((await api.delete("/addresses/nope", ana.token)).status).toBe(404);
  });

  it("deletes own address", async () => {
    const address = await createAddress(ana.id);
    const res = await api.delete(`/addresses/${address.id}`, ana.token);

    expect(res.status).toBe(200);
    const { data } = await service.from("shipping_addresses").select("id").eq("id", address.id);
    expect(data).toEqual([]);
  });

  it("won't delete an address an order was shipped to (409)", async () => {
    const product = await createProduct();
    const order = await createOrder(ana.id, product);

    const res = await api.delete(`/addresses/${order.shipping_address_id}`, ana.token);
    expect(res.status).toBe(409);
  });
});
