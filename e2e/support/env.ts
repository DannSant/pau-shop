import { readFileSync } from "node:fs";
import { join } from "node:path";
import { localSupabaseSecretKey } from "../../scripts/local-supabase.cjs";

// Loads the backend's test settings (local Supabase keys) so the test data
// helpers talk to the same local database as the servers under test.
const file = readFileSync(join(__dirname, "../../pau-shop-backend/.env.test"), "utf8");
for (const line of file.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
}
process.env.SUPABASE_SECRET_KEY ??= localSupabaseSecretKey();

if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.SUPABASE_URL ?? "")) {
  throw new Error("End-to-end tests only run against a local Supabase");
}
