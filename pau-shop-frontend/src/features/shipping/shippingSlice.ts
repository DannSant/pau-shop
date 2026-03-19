import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ShippingAddress {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  street: string;
  exterior_number: string;
  interior_number?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
}

interface ShippingState {
  addresses: ShippingAddress[];
  selectedAddress?: ShippingAddress;
}

const initialState: ShippingState = {
  addresses: [],
  selectedAddress: undefined,
};

const shippingSlice = createSlice({
  name: "shipping",
  initialState,
  reducers: {
    setAddresses(state, action: PayloadAction<ShippingAddress[]>) {
      state.addresses = action.payload;
    },

    selectAddress(state, action: PayloadAction<ShippingAddress>) {
      state.selectedAddress = action.payload;
    },

    addAddress(state, action: PayloadAction<ShippingAddress>) {
      state.addresses.push(action.payload);
    },

    updateAddress(state, action: PayloadAction<ShippingAddress>) {
      const index = state.addresses.findIndex(
        (addr) => addr.id === action.payload.id
      );

      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
  },
});

export const {
  setAddresses,
  selectAddress,
  addAddress,
  updateAddress,
} = shippingSlice.actions;

export default shippingSlice.reducer;