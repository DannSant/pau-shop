import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LocalizedText } from "../../types/localized";

export interface CartItem {
  product_id: string;
  name: LocalizedText;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

// The cart is kept in localStorage so it survives page reloads and the trip
// to Google when signing in.
const CART_KEY = "cart";

const isCartItem = (item: unknown): item is CartItem => {
  const i = item as CartItem;
  return (
    !!i &&
    typeof i.product_id === "string" &&
    typeof i.name?.es === "string" &&
    typeof i.price === "number" &&
    Number.isInteger(i.quantity) &&
    i.quantity > 0
  );
};

export function loadCart(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked: the cart still works for this visit
  }
}

const initialState: CartState = {
  items: loadCart(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {

      const existing = state.items.find(
        (item) => item.product_id === action.payload.product_id
      );

      if (existing) {
        existing.quantity += action.payload.quantity;

        if (existing.quantity <= 0) {
          state.items = state.items.filter(
            (item) => item.product_id !== existing.product_id
          );
        }

      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.product_id !== action.payload
      );
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
