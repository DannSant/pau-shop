import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type Address } from "../../types/address";

interface CheckoutState {
  address: Address | null; 
  totals: any;
}

const initialState: CheckoutState = {
  address: null,
  
  totals: null,
};

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
  },
});

export const {  
  setSelectedAddress,
  setTotals,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;