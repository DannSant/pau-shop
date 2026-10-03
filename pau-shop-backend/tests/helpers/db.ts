import { Pool } from "pg";
import { fakeStripeControl } from "../../src/lib/stripe.fake";
import { supabase } from "../../src/config/supabase";
import { BUCKET } from "../../src/modules/product-images/product-images.service";

// Direct connection to the local test database (supabase start).
export const db = new Pool({
  connectionString: process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  max: 4
});

export async function query<T = any>(sql: string, params: unknown[] = []) {
  const { rows } = await db.query(sql, params);
  return rows as T[];
}

// Empties every table the app writes to, the image bucket and the auth users,
// and forgets fake Stripe sessions. Categories from seed.sql are removed too;
// tests create what they need.
export async function resetData() {
  await db.query(`
    truncate table
      public.deleted_reviews, public.review_bans, public.reviews,
      public.order_items, public.orders, public.shipping_addresses,
      public.product_images, public.products, public.categories,
      public.user_data
    cascade;
    delete from auth.users;
  `);
  await emptyImageBucket();
  fakeStripeControl.reset();
}

// Stored files can only be removed through the Storage API. Images live in
// one folder per product.
async function emptyImageBucket() {
  const bucket = supabase.storage.from(BUCKET);
  const { data: folders } = await bucket.list("", { limit: 1000 });
  for (const folder of folders ?? []) {
    const { data: files } = await bucket.list(folder.name, { limit: 1000 });
    const paths = (files ?? []).map((file) => `${folder.name}/${file.name}`);
    if (paths.length) await bucket.remove(paths);
  }
}
