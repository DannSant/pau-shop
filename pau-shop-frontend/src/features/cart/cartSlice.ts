import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
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
