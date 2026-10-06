import { createClient } from "@supabase/supabase-js";
import { supabase as service } from "../../src/config/supabase";

// Test data, created through the service key on the local database.

export const PASSWORD = "Password123!";
let counter = 0;
const unique = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;

const must = async <T>(promise: PromiseLike<{ data: T; error: any }>) => {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
};

export interface TestUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

// A confirmed user with a profile (phone by default) and a session token.
export async function createUser(
  options: { role?: "user" | "admin"; name?: string; phone?: string | null; profile?: boolean } = {}
): Promise<TestUser> {
  const email = `test-${unique()}@example.com`;
  const name = options.name ?? "Test User";
  const phone = options.phone === undefined ? "5550001234" : options.phone;

  const { user } = await must(
    service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name, ...(phone ? { phone } : {}) }
    })
  );

  if (options.profile !== false) {
    await must(
      service.from("user_data").insert({ id: user!.id, email, name, phone, role: options.role ?? "user" })
    );
  }

  return { id: user!.id, email, name, token: await signIn(email) };
}

export async function signIn(email: string) {
  const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false }
  });
  const { session } = await must(client.auth.signInWithPassword({ email, password: PASSWORD }));
  return session!.access_token;
}

// A client using the public key as this user (what the website itself has).
export function publicClientFor(token?: string) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  });
}

export async function createCategory(overrides: Partial<{ slug: string; name: object; sort_order: number }> = {}) {
  const slug = overrides.slug ?? `cat-${unique()}`;
  return must(
    service
      .from("categories")
      .insert({ slug, name: { es: `Categoría ${slug}` }, sort_order: 0, ...overrides })
      .select()
      .single()
  );
}

export async function createProduct(
  overrides: Partial<{
    name: object;
    description: object | null;
    price: number;
    offer_price: number | null;
    stock: number;
    franchise: string;
    category_id: string | null;
    deleted_at: string | null;
  }> = {}
) {
  return must(
    service
      .from("products")
      .insert({ name: { es: `Producto ${unique()}` }, price: 100, stock: 10, franchise: "Test", ...overrides })
      .select()
      .single()
  );
}

export async function createAddress(userId: string, overrides: Record<string, unknown> = {}) {
  return must(
    service
      .from("shipping_addresses")
      .insert({
        user_id: userId,
        first_name: "Ana",
        last_name: "Prueba",
        phone: "5550001234",
        street: "Calle Falsa",
        exterior_number: "123",
        neighborhood: "Centro",
        city: "CDMX",
        state: "Ciudad de México",
        postal_code: "01000",
        ...overrides
      })
      .select()
      .single()
  );
}

// An order inserted directly (no stock change), e.g. a delivered purchase.
export async function createOrder(
  userId: string,
  product: { id: string; name: object; price: number },
  options: { status?: string; shipping_status?: string; quantity?: number } = {}
) {
  const address = await createAddress(userId);
  const quantity = options.quantity ?? 1;
  const subtotal = product.price * quantity;
  const status = options.status ?? "paid";

  const order = await must(
    service
      .from("orders")
      .insert({
        user_id: userId,
        shipping_address_id: address.id,
        status,
        shipping_status: options.shipping_status ?? "pending",
        subtotal,
        tax: 0,
        import_tax: 0,
        shipping_fee: 0,
        total_amount: subtotal,
        paid_at: status === "paid" ? new Date().toISOString() : null
      })
      .select()
      .single()
  );

  await must(
    service.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity
    })
  );

  return order;
}

export async function createReview(userId: string, productId: string, overrides: Record<string, unknown> = {}) {
  return must(
    service
      .from("reviews")
      .insert({ user_id: userId, product_id: productId, score: 4, comment: "Bien", ...overrides })
      .select()
      .single()
  );
}

export { service };
