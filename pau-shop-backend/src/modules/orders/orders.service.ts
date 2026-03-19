import { supabase } from "../../config/supabase";
import { CreateOrderDTO } from "./orders.types";

export async function createOrder(userId: string, input: CreateOrderDTO) {

  const { data, error } = await supabase.rpc("create_order", {
    p_user_id: userId,
    p_shipping_address: input.shipping_address_id,
    p_items: input.items
  });

  if (error) throw error;

  return data;
}

/*
export async function createOrder(userId: string, input: CreateOrderDTO) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  // 1️⃣ Validate shipping address belongs to user
  const { data: address, error: addressError } = await supabase
    .from("shipping_addresses")
    .select("id")
    .eq("id", input.shipping_address_id)
    .eq("user_id", userId)
    .single();

  if (addressError || !address) {
    throw new Error("Invalid shipping address");
  }

  // 2️⃣ Fetch products
  const productIds = input.items.map(i => i.product_id);

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  if (productError || !products || products.length !== productIds.length) {
    throw new Error("One or more products not found");
  }

  const productMap = new Map(products.map(p => [p.id, p]));

  // 3️⃣ Validate stock + calculate total
  let subtotal = 0;

  const orderItemsToInsert = input.items.map(item => {
    //const product = products.find(p => p.id === item.product_id);
    const product = productMap.get(item.product_id);

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const unitPrice = product.offer_price ?? product.price;
    subtotal += unitPrice * item.quantity;

    return {
      product_id: product.id,
      product_name: product.name,
      unit_price: unitPrice,
      quantity: item.quantity
    };
  });

  // Calculate total using utility function
  const { total, tax, import_tax, shipping_fee } = calculateTotal(subtotal);

  // 4️⃣ Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      shipping_address_id: input.shipping_address_id,
      subtotal: subtotal,
      tax: tax,
      import_tax: import_tax,
      shipping_fee: shipping_fee,
      total_amount: total,
      status: "pending"
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error("Failed to create order");
  }

  // 5️⃣ Insert order items
  const itemsWithOrderId = orderItemsToInsert.map(item => ({
    ...item,
    order_id: order.id
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsWithOrderId);

  if (itemsError) {
    // Rollback order if items insertion fails
    await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);
    throw new Error("Failed to create order items");
  }

  // 6️⃣ Decrease stock
  for (const item of input.items) {
    const product = productMap.get(item.product_id);

    await supabase
      .from("products")
      .update({
        stock: product.stock - item.quantity
      })
      .eq("id", item.product_id);
  }

  return order;
}*/

export async function getMyOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderDetail(userId: string, orderId: string | string[]) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found");
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) throw itemsError;

  return {
    ...order,
    items
  };
}

export async function calculateOrderTotal(subtotal: number) {
  const { data, error } = await supabase.rpc("calculate_order_totals", {
    p_subtotal: subtotal
  });
  if (error) {
    throw error;
  }
  return data;
}


