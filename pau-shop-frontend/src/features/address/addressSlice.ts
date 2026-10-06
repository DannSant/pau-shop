import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Address } from "../../types/address";
import axios from "axios";
import { createAddressApi, deleteAddressApi, getAddressesApi, updateAddressApi } from "../../api/address";

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
};

//
// 🔹 THUNKS
//

// GET /api/addresses/user
export const fetchAddresses = createAsyncThunk(
  "address/fetchAddresses",
  async () => {
    const response = await getAddressesApi();
    return response as Address[];
  }
);

// POST /api/addresses
export const createAddress = createAsyncThunk(
  "address/createAddress",
  async (address: Omit<Address, "id" | "user_id" | "created_at">) => {
    const response = await createAddressApi(address);
    return response as Address;
  }
);

// PUT /api/addresses/:id
export const updateAddress = createAsyncThunk(
  "address/updateAddress",
  async (address: Address) => {
    const response = await updateAddressApi(address);
    return response as Address;
  }
);

// DELETE /api/addresses/:id
// An address an order was shipped to can't be deleted (409): "in_use".
export const deleteAddress = createAsyncThunk<string, string, { rejectValue: "in_use" | "failed" }>(
  "address/deleteAddress",
  async (id, { rejectWithValue }) => {
    try {
      await deleteAddressApi(id);
      return id;
    } catch (err) {
      return rejectWithValue(axios.isAxiosError(err) && err.response?.status === 409 ? "in_use" : "failed");
    }
  }
);

//
// 🔹 SLICE
//

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    clearAddressState(state) {
      state.addresses = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action: PayloadAction<Address[]>) => {
        state.loading = false;

        // Ensure oldest first (important for your requirement)
        state.addresses = action.payload.sort(
          (a, b) =>
            new Date(a.created_at!).getTime() -
            new Date(b.created_at!).getTime()
        );
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch addresses";
      })

      // CREATE
      .addCase(createAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.loading = false;

        // Add new address to list
        state.addresses.push(action.payload);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create address";
      })

      // UPDATE
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.loading = false;

        const index = state.addresses.findIndex(
          (a) => a.id === action.payload.id
        );

        if (index !== -1) {
          state.addresses[index] = action.payload;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update address";
      })

      // DELETE
      .addCase(deleteAddress.fulfilled, (state, action: PayloadAction<string>) => {
        state.addresses = state.addresses.filter((a) => a.id !== action.payload);
      });
  },
});

export const { clearAddressState } = addressSlice.actions;
export default addressSlice.reducer;