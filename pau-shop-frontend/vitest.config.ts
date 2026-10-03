import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Component tests: jsdom, with the backend API faked by MSW (src/test/server.ts)
// and placeholder Supabase settings (no network).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    env: {
      VITE_SUPABASE_URL: "http://supabase.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-key",
      VITE_API_BASE_URL: "http://api.test/api"
    }
  }
});
