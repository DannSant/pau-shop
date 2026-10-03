const { execSync } = require("node:child_process");
const path = require("node:path");

// Asks the running local Supabase (npm run db:start) for its secret key, so
// the key never has to be committed (GitHub blocks pushes containing it).
function localSupabaseSecretKey() {
  let output;
  try {
    output = execSync("npx supabase status -o json", {
      cwd: path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"]
    }).toString();
  } catch {
    throw new Error("The local Supabase isn't running. Start it with: npm run db:start");
  }

  const json = JSON.parse(output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1));
  if (!json.SECRET_KEY) throw new Error("supabase status didn't return a SECRET_KEY");
  return json.SECRET_KEY;
}

module.exports = { localSupabaseSecretKey };
