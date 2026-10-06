#!/usr/bin/env node
// Copies data between the test and production databases.
//
//   node scripts/db-sync.mjs catalog       [--apply] [--with-stock] [--yes]
//       test -> prod: categories, products and product images (files too).
//       Never touches users, orders, reviews; stock only with --with-stock.
//
//   node scripts/db-sync.mjs prod-to-test  [--apply] [--yes]
//       prod -> test: everything, with customers anonymized. Replaces test's
//       data (accounts listed in TEST_KEEP_EMAILS are kept).
//
// Without --apply nothing is written: the script only shows what would change.
// --yes skips the typed confirmation (for GitHub Actions, which asks instead).
//
// Connection settings come from the environment (never stored):
//   TEST_DB_URL, TEST_SUPABASE_URL, TEST_SECRET_KEY
//   PROD_DB_URL, PROD_SUPABASE_URL, PROD_SECRET_KEY
//   TEST_KEEP_EMAILS (optional, comma separated)

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-images";
const PUBLIC_PATH = `/storage/v1/object/public/${BUCKET}/`;

// ------------------------------------------------------------------ settings

const [command, ...flags] = process.argv.slice(2);
const apply = flags.includes("--apply");
const withStock = flags.includes("--with-stock");
const skipPrompt = flags.includes("--yes");

function environment(name) {
  const read = (key) => {
    const value = process.env[`${name}_${key}`];
    if (!value) throw new Error(`Missing ${name}_${key}`);
    return value;
  };
  const supabaseUrl = read("SUPABASE_URL").replace(/\/$/, "");
  return {
    name,
    dbUrl: read("DB_URL"),
    supabaseUrl,
    storage: createClient(supabaseUrl, read("SECRET_KEY"), { auth: { persistSession: false } }).storage.from(BUCKET),
    publicBase: `${supabaseUrl}${PUBLIC_PATH}`
  };
}

async function connect(env) {
  const client = new pg.Client({ connectionString: env.dbUrl, ssl: /localhost|127\.0\.0\.1/.test(env.dbUrl) ? false : { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

async function confirm(target) {
  if (skipPrompt) return;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`\nType "${target}" to write these changes to ${target.toUpperCase()}: `);
  rl.close();
  if (answer.trim() !== target) throw new Error("Not confirmed; nothing was written.");
}

const rowsOf = async (db, sql, params = []) => (await db.query(sql, params)).rows;

// Inserts rows (as returned by node-postgres) into a table, letting Postgres
// convert every column type from JSON.
async function insertRows(db, table, rows, onConflict = "") {
  if (rows.length === 0) return;
  await db.query(
    `insert into ${table} select * from json_populate_recordset(null::${table}, $1) ${onConflict}`,
    [JSON.stringify(rows)]
  );
}

// ------------------------------------------------------------------- images

const storagePath = (url, env) => (url.startsWith(env.publicBase) ? decodeURIComponent(url.slice(env.publicBase.length)) : null);

// Copies an image file between buckets (same path) and returns its new URL.
// URLs that don't point to the source bucket are kept as they are.
async function copyImage(url, from, to) {
  const path = storagePath(url, from);
  if (!path) return url;

  const { data: file, error } = await from.storage.download(path);
  if (error) throw new Error(`Couldn't download ${path}: ${error.message}`);
  const { error: uploadError } = await to.storage.upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (uploadError) throw new Error(`Couldn't upload ${path}: ${uploadError.message}`);
  return `${to.publicBase}${path.split("/").map(encodeURIComponent).join("/")}`;
}

// ------------------------------------------------------------- catalog sync

const CATALOG_PRODUCT_COLUMNS = ["name", "description", "price", "offer_price", "franchise", "category_id", "deleted_at", "updated_at"];

async function syncCatalog() {
  const from = environment("TEST");
  const to = environment("PROD");
  if (from.dbUrl === to.dbUrl) throw new Error("TEST_DB_URL and PROD_DB_URL are the same database");

  const source = await connect(from);
  const target = await connect(to);

  try {
    // One query at a time per connection.
    const srcCategories = await rowsOf(source, "select * from public.categories order by sort_order, id");
    const srcProducts = await rowsOf(source, "select * from public.products order by created_at, id");
    const srcImages = await rowsOf(source, "select * from public.product_images order by created_at, id");
    const dstCategories = await rowsOf(target, "select * from public.categories");
    const dstProducts = await rowsOf(target, "select * from public.products");
    const dstImages = await rowsOf(target, "select * from public.product_images");

    // What would change
    const byId = (rows) => new Map(rows.map((row) => [row.id, row]));
    const dstCategoryById = byId(dstCategories);
    const dstProductById = byId(dstProducts);
    const dstImageById = byId(dstImages);
    const srcProductIds = new Set(srcProducts.map((p) => p.id));
    const srcImageIds = new Set(srcImages.map((i) => i.id));

    const same = (a, b, columns) => columns.every((c) => JSON.stringify(a[c] ?? null) === JSON.stringify(b[c] ?? null));
    const categoryChanges = srcCategories.filter((c) => !dstCategoryById.has(c.id) || !same(c, dstCategoryById.get(c.id), ["slug", "name", "sort_order"]));
    const productColumns = withStock ? [...CATALOG_PRODUCT_COLUMNS.filter((c) => c !== "updated_at"), "stock"] : CATALOG_PRODUCT_COLUMNS.filter((c) => c !== "updated_at");
    const productChanges = srcProducts.filter((p) => !dstProductById.has(p.id) || !same(p, dstProductById.get(p.id), productColumns));
    const productsToRetire = dstProducts.filter((p) => !srcProductIds.has(p.id) && p.deleted_at === null);
    const newImages = srcImages.filter((i) => !dstImageById.has(i.id));
    const changedThumbnails = srcImages.filter((i) => dstImageById.has(i.id) && dstImageById.get(i.id).is_thumbnail !== i.is_thumbnail);
    const imagesToRemove = dstImages.filter((i) => srcProductIds.has(i.product_id) && !srcImageIds.has(i.id));

    console.log(`Catalog TEST -> PROD${apply ? "" : " (dry run: nothing will be written)"}`);
    console.log(`  categories: ${categoryChanges.filter((c) => !dstCategoryById.has(c.id)).length} new, ${categoryChanges.filter((c) => dstCategoryById.has(c.id)).length} changed`);
    console.log(`  products:   ${productChanges.filter((p) => !dstProductById.has(p.id)).length} new, ${productChanges.filter((p) => dstProductById.has(p.id)).length} changed, ${productsToRetire.length} hidden in prod (not in test)`);
    console.log(`  images:     ${newImages.length} new, ${changedThumbnails.length} main-image changes, ${imagesToRemove.length} removed`);
    console.log(`  stock:      ${withStock ? "copied from test" : "kept as in prod (new products start with test's stock)"}`);

    const nothingToDo = !categoryChanges.length && !productChanges.length && !productsToRetire.length && !newImages.length && !changedThumbnails.length && !imagesToRemove.length;
    if (nothingToDo) return console.log("\nProduction already matches test. Nothing to do.");
    if (!apply) return console.log("\nRun again with --apply to write these changes.");

    await confirm("prod");

    // Backup of production's catalog first.
    const file = saveBackup("catalog-prod", { categories: dstCategories, products: dstProducts, product_images: dstImages });
    console.log(`\nBackup of production's catalog: ${file}`);

    // Files first: if the database step fails, extra files do no harm.
    const imageRows = [];
    for (const image of newImages) {
      imageRows.push({ ...image, url: await copyImage(image.url, from, to), is_thumbnail: false });
    }

    await target.query("begin");
    try {
      await insertRows(target, "public.categories", srcCategories,
        "on conflict (id) do update set slug = excluded.slug, name = excluded.name, sort_order = excluded.sort_order");

      const updateColumns = withStock ? [...CATALOG_PRODUCT_COLUMNS, "stock"] : CATALOG_PRODUCT_COLUMNS;
      await insertRows(target, "public.products", srcProducts,
        `on conflict (id) do update set ${updateColumns.map((c) => `${c} = excluded.${c}`).join(", ")}`);

      if (productsToRetire.length) {
        await target.query("update public.products set deleted_at = now() where id = any($1) and deleted_at is null", [productsToRetire.map((p) => p.id)]);
      }

      if (imagesToRemove.length) {
        await target.query("delete from public.product_images where id = any($1)", [imagesToRemove.map((i) => i.id)]);
      }
      await insertRows(target, "public.product_images", imageRows);

      // Main images: clear, then set (only one per product is allowed).
      const syncedProducts = [...srcProductIds];
      await target.query("update public.product_images set is_thumbnail = false where product_id = any($1)", [syncedProducts]);
      const thumbnails = srcImages.filter((i) => i.is_thumbnail).map((i) => i.id);
      if (thumbnails.length) await target.query("update public.product_images set is_thumbnail = true where id = any($1)", [thumbnails]);

      await target.query("commit");
    } catch (err) {
      await target.query("rollback");
      throw err;
    }

    // Files of removed images, after the database no longer points to them.
    const removedPaths = imagesToRemove.map((i) => storagePath(i.url, to)).filter(Boolean);
    if (removedPaths.length) await to.storage.remove(removedPaths);

    console.log("Done: production's catalog now matches test.");
  } finally {
    await source.end();
    await target.end();
  }
}

// --------------------------------------------------------------- prod -> test

// Tables in the order they can be inserted (foreign keys).
const ALL_TABLES = [
  "categories", "products", "product_images", "user_data", "shipping_addresses",
  "orders", "order_items", "reviews", "deleted_reviews", "review_bans"
];

async function prodToTest() {
  const from = environment("PROD");
  const to = environment("TEST");
  if (from.dbUrl === to.dbUrl) throw new Error("TEST_DB_URL and PROD_DB_URL are the same database");

  const keepEmails = (process.env.TEST_KEEP_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const source = await connect(from);
  const target = await connect(to);

  try {
    const data = {};
    for (const table of ALL_TABLES) data[table] = await rowsOf(source, `select * from public.${table}`);
    const users = await rowsOf(source, "select id, created_at from auth.users order by created_at, id");
    const kept = await rowsOf(target, "select id, email from auth.users where lower(email) = any($1)", [keepEmails]);
    const keptIds = new Set(kept.map((u) => u.id));
    const clashing = users.filter((u) => keptIds.has(u.id));
    if (clashing.length) throw new Error("A kept test account has the same id as a production user");

    console.log(`PROD -> TEST${apply ? "" : " (dry run: nothing will be written)"}`);
    for (const table of ALL_TABLES) console.log(`  ${table.padEnd(19)} ${data[table].length}`);
    console.log(`  auth users          ${users.length} (emails, names, phones and addresses anonymized)`);
    console.log(`  kept test accounts  ${kept.map((u) => u.email).join(", ") || "none"}`);
    console.log("  Everything else in TEST is replaced.");
    if (!apply) return console.log("\nRun again with --apply to write these changes.");

    await confirm("test");

    // Anonymize: customer N gets made-up contact details everywhere.
    const number = new Map(users.map((u, i) => [u.id, i + 1]));
    const fakeEmail = (id) => `cliente-${number.get(id) ?? 0}@example.com`;
    const fakePhone = (id) => `555${String(number.get(id) ?? 0).padStart(7, "0")}`;

    const userData = data.user_data.map((u) => ({ ...u, email: fakeEmail(u.id), name: `Cliente ${number.get(u.id) ?? 0}`, phone: u.phone ? fakePhone(u.id) : null }));
    const addresses = data.shipping_addresses.map((a, i) => ({
      ...a,
      first_name: "Cliente",
      last_name: String(number.get(a.user_id) ?? 0),
      phone: fakePhone(a.user_id),
      street: "Calle de Prueba",
      exterior_number: String(i + 1),
      interior_number: null,
      special_instructions: null,
      neighborhood: "Centro",
      postal_code: "00000"
    }));
    const orders = data.orders.map((o) => ({ ...o, stripe_session_id: null }));

    // Images
    const images = [];
    for (const image of data.product_images) images.push({ ...image, url: await copyImage(image.url, from, to) });

    const keptProfiles = await rowsOf(target, "select * from public.user_data where id = any($1)", [[...keptIds]]);

    await target.query("begin");
    try {
      await target.query(`truncate table ${ALL_TABLES.map((t) => `public.${t}`).join(", ")} cascade`);
      await target.query("delete from auth.users where not (id = any($1))", [[...keptIds]]);

      // Accounts that exist (for the foreign keys) but can't sign in.
      for (const user of users) {
        await target.query(
          // The token columns must be '' rather than NULL, or Supabase Auth
          // fails to read the users table.
          `insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
             raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
             confirmation_token, recovery_token, email_change_token_new, email_change)
           values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '', now(),
             '{"provider":"email","providers":["email"]}', $3, $4, now(), '', '', '', '')`,
          [user.id, fakeEmail(user.id), JSON.stringify({ name: `Cliente ${number.get(user.id)}` }), user.created_at]
        );
      }

      const rows = { ...data, user_data: [...userData, ...keptProfiles], shipping_addresses: addresses, orders, product_images: images };
      for (const table of ALL_TABLES) await insertRows(target, `public.${table}`, rows[table]);

      await target.query("commit");
    } catch (err) {
      await target.query("rollback");
      throw err;
    }

    console.log("Done: test now has production's data, anonymized.");
  } finally {
    await source.end();
    await target.end();
  }
}

// ------------------------------------------------------------------- helpers

function saveBackup(name, content) {
  const dir = join(process.cwd(), "backups");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(content, null, 2));
  return file;
}

const commands = { catalog: syncCatalog, "prod-to-test": prodToTest };

if (!commands[command]) {
  console.error("Usage: node scripts/db-sync.mjs <catalog|prod-to-test> [--apply] [--with-stock] [--yes]");
  process.exit(1);
}

commands[command]().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
