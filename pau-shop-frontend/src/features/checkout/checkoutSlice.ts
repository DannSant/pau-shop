import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type Address } from "../../types/address";
import { createOrder, type OrderTotals } from "../../api/orders";
import { createCheckoutSession } from "../../api/payments";
import { apiErrorMessage } from "../../api/request";
import type { RootState } from "../../app/store";
import type { es } from "../../i18n/es";

// Keys of t.checkout.errors.
export type CheckoutError = keyof typeof es.checkout.errors;

interface CheckoutState {
  address: Address | null;
  totals: OrderTotals | null;
  addressConfirmed: boolean;
  // True from "Pagar ahora" until the browser leaves for Stripe (or it fails).
  submitting: boolean;
  error: CheckoutError | null;
}

const initialState: CheckoutState = {
  address: null,
  totals: null,
  addressConfirmed: false,
  submitting: false,
  error: null,
};

// Turns the backend's message into something we can explain to the customer.
export function toCheckoutError(message: string): CheckoutError {
  if (/insufficient stock/i.test(message)) return "outOfStock";
  if (/product not found/i.test(message)) return "productUnavailable";
  if (/phone/i.test(message)) return "phoneRequired";
  if (/shipping address/i.test(message)) return "invalidAddress";
  return "generic";
}

export const startCheckout = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: CheckoutError }
>(
  "checkout/startCheckout",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const address = state.checkout.address;
    if (!address?.id) return rejectWithValue("invalidAddress");

    try {
      const orderId = await createOrder({
        shipping_address_id: address.id,
        items: state.cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      const session = await createCheckoutSession(orderId);
      window.location.href = session.checkout_url;
    } catch (err) {
      console.error("Checkout failed:", err);
      return rejectWithValue(toCheckoutError(apiErrorMessage(err)));
    }
  },
  // Ignore extra clicks while a checkout is already starting.
  { condition: (_, { getState }) => !getState().checkout.submitting }
);

const checkoutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {

    setSelectedAddress(state, action: PayloadAction<Address>) {
      state.address = action.payload;
    },
    setTotals(state, action: PayloadAction<OrderTotals>) {
      state.totals = action.payload;
    },
    setAddressConfirmed(state, action: PayloadAction<boolean>) {
      state.addressConfirmed = action.payload;
    },
    // The page came back from Stripe through the browser's back button.
    resetCheckoutStatus(state) {
      state.submitting = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startCheckout.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      // On success the browser is leaving for Stripe: keep the button disabled.
      .addCase(startCheckout.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload ?? "generic";
      });
  },
});

export const {
  setSelectedAddress,
  setTotals,
  setAddressConfirmed,
  resetCheckoutStatus
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
