#!/usr/bin/env node
// Loads the SEPOMEX postal code catalog into public.postal_codes.
//
//   node scripts/import-sepomex.mjs <CPdescarga.txt> [--apply] [--yes]
//
// Download the file from Correos de México ("Consulta de códigos postales" >
// "Descarga", format TXT, all states). It is pipe separated and Latin-1.
//
// Without --apply nothing is written: the script only reads the file and
// shows what it found. With --apply it replaces the whole table in one
// transaction. --yes skips the typed confirmation.
//
// Connection: DB_URL in the environment (never stored), e.g. TEST_DB_URL or
// PROD_DB_URL from db-sync.mjs, or the local database:
//   postgresql://postgres:postgres@127.0.0.1:54322/postgres

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import pg from "pg";

// SEPOMEX state names are the official long ones ("Coahuila de Zaragoza",
// "México"); the app uses the short ones from mexico.ts. Mapped by INEGI code.
const STATES = {
  "01": "Aguascalientes", "02": "Baja California", "03": "Baja California Sur",
  "04": "Campeche", "05": "Coahuila", "06": "Colima", "07": "Chiapas",
  "08": "Chihuahua", "09": "Ciudad de México", "10": "Durango",
  "11": "Guanajuato", "12": "Guerrero", "13": "Hidalgo", "14": "Jalisco",
  "15": "Estado de México", "16": "Michoacán", "17": "Morelos", "18": "Nayarit",
  "19": "Nuevo León", "20": "Oaxaca", "21": "Puebla", "22": "Querétaro",
  "23": "Quintana Roo", "24": "San Luis Potosí", "25": "Sinaloa", "26": "Sonora",
  "27": "Tabasco", "28": "Tamaulipas", "29": "Tlaxcala", "30": "Veracruz",
  "31": "Yucatán", "32": "Zacatecas"
};

const BATCH_SIZE = 5000;

const [file, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
const skipPrompt = flags.includes("--yes");

if (!file) {
  console.error("Usage: node scripts/import-sepomex.mjs <CPdescarga.txt> [--apply] [--yes]");
  process.exit(1);
}

function parseSepomex(text) {
  const lines = text.split(/\r?\n/);
  // The first line is a copyright notice; the header starts with d_codigo.
  const headerIndex = lines.findIndex((line) => line.startsWith("d_codigo|"));
  if (headerIndex === -1) throw new Error("Header line (d_codigo|...) not found. Is this the TXT download?");

  const columns = lines[headerIndex].split("|");
  const col = (name) => {
    const index = columns.indexOf(name);
    if (index === -1) throw new Error(`Column ${name} not found`);
    return index;
  };
  const cp = col("d_codigo"), asenta = col("d_asenta"), tipo = col("d_tipo_asenta"),
    mnpio = col("D_mnpio"), ciudad = col("d_ciudad"), estado = col("c_estado");

  const rows = [];
  const skipped = [];
  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim()) continue;
    const f = line.split("|").map((v) => v.trim());
    const state = STATES[f[estado]?.padStart(2, "0")];
    if (!/^\d{5}$/.test(f[cp]) || !f[asenta] || !f[mnpio] || !state) {
      skipped.push(line);
      continue;
    }
    rows.push({
      postal_code: f[cp],
      neighborhood: f[asenta],
      neighborhood_type: f[tipo] || null,
      municipality: f[mnpio],
      city: f[ciudad] || null,
      state
    });
  }
  return { rows, skipped };
}

async function confirm() {
  if (skipPrompt) return;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This replaces every row in public.postal_codes. Type "replace" to continue: ');
  rl.close();
  if (answer.trim() !== "replace") {
    console.log("Cancelled.");
    process.exit(1);
  }
}

async function main() {
  const { rows, skipped } = parseSepomex(new TextDecoder("latin1").decode(readFileSync(file)));
  const codes = new Set(rows.map((r) => r.postal_code));
  const states = new Set(rows.map((r) => r.state));

  console.log(`${rows.length} colonias, ${codes.size} postal codes, ${states.size} states.`);
  if (skipped.length) console.log(`${skipped.length} lines skipped, e.g.: ${skipped[0]}`);
  console.log("Example:", rows[0]);

  if (!apply) {
    console.log("Dry run. Add --apply to write.");
    return;
  }
  if (states.size !== 32) throw new Error(`Expected 32 states, found ${states.size}. Not importing a partial file.`);

  const dbUrl = process.env.DB_URL;
  if (!dbUrl) throw new Error("Missing DB_URL");
  await confirm();

  const client = new pg.Client({ connectionString: dbUrl, ssl: /localhost|127\.0\.0\.1/.test(dbUrl) ? false : { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("truncate table public.postal_codes restart identity");
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const column = (key) => batch.map((r) => r[key]);
      await client.query(
        `insert into public.postal_codes (postal_code, neighborhood, neighborhood_type, municipality, city, state)
         select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[])`,
        [column("postal_code"), column("neighborhood"), column("neighborhood_type"), column("municipality"), column("city"), column("state")]
      );
      process.stdout.write(`\r${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`);
    }
    await client.query("commit");
    console.log("\nDone.");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
