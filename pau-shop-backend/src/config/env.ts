import dotenv from "dotenv";

// Tests and the end-to-end servers use ENV_FILE=.env.test (local Supabase,
// fake Stripe); everything else reads .env.
dotenv.config({ path: process.env.ENV_FILE ?? ".env", quiet: true });

if (!process.env.SUPABASE_URL) {
  throw new Error("❌ SUPABASE_URL is not defined");
}

if (!process.env.SUPABASE_SECRET_KEY) {
  throw new Error("❌ SUPABASE_SECRET_KEY is not defined");
}
