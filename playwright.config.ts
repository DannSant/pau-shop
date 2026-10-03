import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { localSupabaseSecretKey } from "./scripts/local-supabase.cjs";

// The local Supabase secret key isn't committed: read it once from the running
// local Supabase; test workers and the backend server inherit it.
process.env.SUPABASE_SECRET_KEY ??= localSupabaseSecretKey();

// LIVE_STRIPE=1 runs only the @live-stripe test, against Stripe's real test
// mode, using the Stripe *test* key from pau-shop-backend/.env.
const liveStripe = !!process.env.LIVE_STRIPE;

function stripeTestKey() {
  const env = readFileSync("pau-shop-backend/.env", "utf8");
  const key = env.match(/^STRIPE_SECRET_KEY=(.*)$/m)?.[1]?.trim() ?? "";
  if (!key.startsWith("sk_test_")) throw new Error("LIVE_STRIPE needs a Stripe test key (sk_test_...) in pau-shop-backend/.env");
  return key;
}

// End-to-end tests: the real frontend and backend against the local Supabase
// (npm run db:start) with fake Stripe. Ports 5174/4100 leave the dev servers
// (5173/4000) free.
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Specs share one database; each creates its own users and products.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  outputDir: "e2e/results",
  grep: liveStripe ? /@live-stripe/ : undefined,
  grepInvert: liveStripe ? undefined : /@live-stripe/,
  use: {
    baseURL: "http://localhost:5174",
    ...devices["Desktop Chrome"],
    locale: "es-MX",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: [
    {
      command: "npx ts-node-dev --transpile-only src/server.ts",
      cwd: "pau-shop-backend",
      url: "http://localhost:4100/api/categories",
      env: {
        ENV_FILE: ".env.test",
        SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY!,
        ...(liveStripe ? { STRIPE_MODE: "stripe", STRIPE_SECRET_KEY: stripeTestKey() } : {})
      },
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: "npx vite --mode test --port 5174 --strictPort",
      cwd: "pau-shop-frontend",
      url: "http://localhost:5174",
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
});
