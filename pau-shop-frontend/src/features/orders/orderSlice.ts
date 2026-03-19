import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { calculateTotals } from "../../api/orders";

interface OrderTotals {
  subtotal: number;
  tax: number;
  import_tax: number;
  shipping_fee: number;
  total: number;
}

interface OrderState {
  orderId?: string;
  totals?: OrderTotals;
  status: "idle" | "creating" | "created" | "paid";
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  status: "idle",
  loading: false,
  error: null,
};

export const fetchOrderTotals = createAsyncThunk(
  "order/fetchTotals",
  async (amount: number) => {
    const response = await calculateTotals(amount);
    
    return (response as any)[0];
  }
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setTotals(state, action: PayloadAction<OrderTotals>) {
      state.totals = action.payload;
    },

    setOrderId(state, action: PayloadAction<string>) {
      state.orderId = action.payload;
      state.status = "created";
    },

    setOrderStatus(
      state,
      action: PayloadAction<"idle" | "creating" | "created" | "paid">
    ) {
      state.status = action.payload;
    },

    clearOrder(state) {
      state.orderId = undefined;
      state.totals = undefined;
      state.status = "idle";
    },
  },
   extraReducers: (builder) => {
    builder
      .addCase(fetchOrderTotals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderTotals.fulfilled, (state, action) => {
        state.loading = false;
        state.totals = action.payload;
      })
      .addCase(fetchOrderTotals.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to calculate totals";
      });
  },
});

export const {
  setTotals,
  setOrderId,
  setOrderStatus,
  clearOrder,
} = orderSlice.actions;

export default orderSlice.reducer;