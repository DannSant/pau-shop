// Runs before every test file: load the test environment (local Supabase,
// fake Stripe) before any app code reads process.env.
import { localSupabaseSecretKey } from "../../scripts/local-supabase.cjs";

process.env.ENV_FILE ??= ".env.test";
process.env.NODE_ENV ??= "test";
process.env.SUPABASE_SECRET_KEY ??= localSupabaseSecretKey();

await import("../src/config/env");

const { hostname } = new URL(process.env.SUPABASE_URL!);
if (!["127.0.0.1", "localhost"].includes(hostname)) {
  throw new Error(`Tests only run against a local Supabase, not ${hostname}`);
}
if (process.env.STRIPE_MODE !== "fake") {
  throw new Error("Tests need STRIPE_MODE=fake");
}
