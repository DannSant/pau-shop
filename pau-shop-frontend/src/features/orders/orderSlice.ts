import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { calculateTotals, getOrderDetail, getMyOrders, type Order, type OrderDetail } from "../../api/orders";

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
  orderDetail?: OrderDetail;
  orderDetailLoading: boolean;
  orderDetailError: string | null;
  myOrders: Order[];
  myOrdersLoading: boolean;
}

const initialState: OrderState = {
  status: "idle",
  loading: false,
  error: null,
  orderDetailLoading: false,
  orderDetailError: null,
  myOrders: [],
  myOrdersLoading: false,
};

export const fetchOrderTotals = createAsyncThunk(
  "order/fetchTotals",
  async (amount: number) => {
    const response = await calculateTotals(amount);

    return (response as any)[0];
  }
);

export const fetchOrderDetail = createAsyncThunk(
  "order/fetchDetail",
  async (orderId: string) => {
    return await getOrderDetail(orderId);
  }
);

export const fetchMyOrders = createAsyncThunk(
  "order/fetchMyOrders",
  async () => {
    return await getMyOrders();
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
      })
      .addCase(fetchOrderDetail.pending, (state) => {
        state.orderDetailLoading = true;
        state.orderDetailError = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.orderDetailLoading = false;
        state.orderDetail = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.orderDetailLoading = false;
        state.orderDetailError = action.error.message ?? "Failed to fetch order";
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.myOrdersLoading = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.myOrdersLoading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state) => {
        state.myOrdersLoading = false;
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