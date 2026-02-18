import dotenv from "dotenv";

dotenv.config();

if (!process.env.SUPABASE_URL) {
  throw new Error("❌ SUPABASE_URL is not defined");
}

if (!process.env.SUPABASE_SECRET_KEY) {
  throw new Error("❌ SUPABASE_SECRET_KEY is not defined");
}
