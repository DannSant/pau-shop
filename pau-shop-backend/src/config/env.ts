import dotenv from "dotenv";

// Tests and the end-to-end servers use ENV_FILE=.env.test (local Supabase,
// fake Stripe); local development reads .env. On Render the variables come
// from the dashboard and there is no file.
dotenv.config({ path: process.env.ENV_FILE ?? ".env", quiet: true });

const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"];

// A deployed server must also be able to take payments and know its site.
if (process.env.NODE_ENV === "production") {
  required.push("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "FRONTEND_URL");
}

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`❌ Missing environment variables: ${missing.join(", ")}`);
}
