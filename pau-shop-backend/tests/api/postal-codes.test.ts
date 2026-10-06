import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createUser, TestUser } from "../helpers/factories";

// Uses the sample postal codes from supabase/seed.sql.
let ana: TestUser;

beforeAll(async () => {
  await resetData();
  ana = await createUser({ name: "Ana" });
});

describe("postal codes", () => {
  it("needs a signed-in user (401)", async () => {
    expect((await api.get("/postal-codes/06600")).status).toBe(401);
  });

  it("returns the state, city and colonias of a postal code", async () => {
    const res = await api.get("/postal-codes/03100", ana.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      postal_code: "03100",
      state: "Ciudad de México",
      city: "Ciudad de México",
      neighborhoods: ["Del Valle Centro", "Insurgentes San Borja"]
    });
  });

  it("returns 404 for a postal code that doesn't exist", async () => {
    expect((await api.get("/postal-codes/99999", ana.token)).status).toBe(404);
  });

  it("rejects anything that isn't 5 digits (400)", async () => {
    expect((await api.get("/postal-codes/abc", ana.token)).status).toBe(400);
  });
});
