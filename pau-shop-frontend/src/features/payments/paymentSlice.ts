import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PaymentState {
  checkoutUrl?: string;
  sessionId?: string;
}

const initialState: PaymentState = {};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    setCheckoutSession(
      state,
      action: PayloadAction<{ sessionId: string; checkoutUrl: string }>
    ) {
      state.sessionId = action.payload.sessionId;
      state.checkoutUrl = action.payload.checkoutUrl;
    },

    clearPayment(state) {
      state.sessionId = undefined;
      state.checkoutUrl = undefined;
    },
  },
});

export const { setCheckoutSession, clearPayment } = paymentSlice.actions;

export default paymentSlice.reducer;