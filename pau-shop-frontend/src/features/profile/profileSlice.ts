import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getMe, updateProfile, type UpdateUserProfilePayload } from "../../api/users";
import type { UserProfile } from "../../types/user";
import { logout, setProfileStatus } from "../auth/authSlice";
import { rememberProfile } from "../auth/ensureUserProfile";

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
  async (payload: UpdateUserProfilePayload, { dispatch }) => {
    const profile = await updateProfile(payload);

    // Keep the auth state (e.g. the /complete-profile gate) and cache in sync.
    rememberProfile(profile);
    dispatch(
      setProfileStatus({ userId: profile.id, role: profile.role, hasPhone: !!profile.phone })
    );

    return profile;
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
