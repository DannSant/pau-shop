import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMe, updateProfile, type UpdateUserProfilePayload } from "../../api/users";
import type { UserProfile } from "../../types/user";
import { logout } from "../auth/authSlice";

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchProfile = createAsyncThunk("profile/fetchProfile", async () => {
  return await getMe();
});

export const saveProfile = createAsyncThunk(
  "profile/saveProfile",
  async (payload: UpdateUserProfilePayload) => {
    return await updateProfile(payload);
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load profile";
      })
      .addCase(saveProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to save profile";
      })
      // Never show the previous user's profile after logging out.
      .addCase(logout, () => initialState);
  },
});

export default profileSlice.reducer;
