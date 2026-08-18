import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type Address } from "../../types/address";
import { createOrder } from "../../api/orders";
import { createCheckoutSession } from "../../api/payments";

interface CheckoutState {
  address: Address | null;
  totals: any;
  addressConfirmed: boolean;
}

const initialState: CheckoutState = {
  address: null,
  totals: null,
  addressConfirmed: false,
};

export const startCheckout = createAsyncThunk(
  "checkout/startCheckout",
  async (_, { getState }) => {
    try {
      console.log("Starting checkout process...");
      const state: any = getState();

      const cartItems = state.cart.items;
      const address = state.checkout.address;

      if (!address) {
        throw new Error("No address selected");
      }

      // 1️⃣ Create order
      const order = await createOrder({
        shipping_address_id: address.id,
        items: cartItems.map((item: any) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      // 2️⃣ Create Stripe session
      const session = await createCheckoutSession(order);

      // 3️⃣ Redirect
      window.location.href = session.checkout_url;
    } catch (err) {
      console.error("Checkout failed:", err);
      return false;
    }

    return true;
  }
);

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {

    setSelectedAddress(state, action: PayloadAction<Address>) {
      state.address = action.payload;
    },
    setTotals(state, action: PayloadAction<any>) {
      state.totals = action.payload;
    },
    setAddressConfirmed(state, action: PayloadAction<boolean>) {
      state.addressConfirmed = action.payload;
    }
  },
});

export const {
  setSelectedAddress,
  setTotals,
  setAddressConfirmed
} = checkoutSlice.actions;

export default checkoutSlice.reducer;