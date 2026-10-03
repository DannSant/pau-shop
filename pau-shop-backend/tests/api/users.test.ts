import { beforeAll, describe, expect, it } from "vitest";
import { api } from "../helpers/api";
import { resetData } from "../helpers/db";
import { createUser, service, TestUser } from "../helpers/factories";

let admin: TestUser;

beforeAll(async () => {
  await resetData();
  admin = await createUser({ role: "admin" });
});

describe("GET /users/me", () => {
  it("needs a valid token (401)", async () => {
    expect((await api.get("/users/me")).status).toBe(401);
    expect((await api.get("/users/me", "not-a-token")).status).toBe(401);
  });

  it("returns the profile", async () => {
    const user = await createUser({ name: "Carla Ruiz", phone: "5551112222" });
    const res = await api.get("/users/me", user.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, name: "Carla Ruiz", phone: "5551112222", role: "user" });
  });

  it("creates a missing profile from the sign-up data", async () => {
    const user = await createUser({ name: "Sin Perfil", phone: "5553334444", profile: false });
    const res = await api.get("/users/me", user.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, name: "Sin Perfil", phone: "5553334444", role: "user" });
  });

  it("creates the profile once when two requests arrive together", async () => {
    const user = await createUser({ profile: false });
    const [a, b] = await Promise.all([api.get("/users/me", user.token), api.get("/users/me", user.token)]);

    expect([a.status, b.status]).toEqual([200, 200]);
    const { count } = await service.from("user_data").select("id", { count: "exact", head: true }).eq("id", user.id);
    expect(count).toBe(1);
  });
});

describe("PATCH /users/me", () => {
  it("updates name and phone", async () => {
    const user = await createUser();
    const res = await api.patch("/users/me", { name: " Nuevo Nombre ", phone: "+52 (55) 1234-5678" }, user.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: "Nuevo Nombre", phone: "+52 (55) 1234-5678" });
  });

  it("can't change the role", async () => {
    const user = await createUser();
    const res = await api.patch("/users/me", { name: "X", phone: "5550000000", role: "admin" }, user.token);
    expect(res.body.data.role).toBe("user");
  });

  it.each([
    ["an empty name", { name: "  ", phone: "5550000000" }, "Name is required"],
    ["an invalid phone", { name: "Ana", phone: "12" }, "Invalid phone number"],
    ["a missing phone", { name: "Ana" }, "Invalid phone number"]
  ])("rejects %s (400)", async (_label, body, message) => {
    const user = await createUser();
    const res = await api.patch("/users/me", body, user.token);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });
});

describe("POST /users/profile", () => {
  it("requires a phone (400)", async () => {
    const user = await createUser({ profile: false });
    expect((await api.post("/users/profile", { name: "Ana" }, user.token)).status).toBe(400);
  });

  it("creates the profile, always as a regular user", async () => {
    const user = await createUser({ profile: false });
    const res = await api.post("/users/profile", { name: "Ana", phone: "5550001111", role: "admin" }, user.token);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: "Ana", phone: "5550001111", role: "user" });
  });

  it("returns the existing profile if it already exists", async () => {
    const user = await createUser({ name: "Primero" });
    const res = await api.post("/users/profile", { name: "Segundo", phone: "5550002222" }, user.token);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Primero");
  });
});

describe("GET /users (admin)", () => {
  it("is admin only", async () => {
    const user = await createUser();
    expect((await api.get("/users", user.token)).status).toBe(403);
    const res = await api.get("/users", admin.token);
    expect(res.status).toBe(200);
    expect(res.body.data.some((u: any) => u.id === user.id)).toBe(true);
  });
});
