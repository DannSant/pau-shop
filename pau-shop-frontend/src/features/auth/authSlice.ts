import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { login, signup } from "../../api/auth";
import { supabase } from "../../lib/supabase";

interface AuthUser {
  id: string;
  email: string;
  // From user_data ("user" | "admin"); null until the profile has loaded.
  role: string | null;
  // Whether user_data has a phone; null until the profile has loaded.
  // Google sign-ins start without one and are sent to /complete-profile.
  hasPhone: boolean | null;
}

type SessionUser = Pick<AuthUser, "id" | "email">;

// Session updates (login, token refresh, other tabs) keep the profile status
// already loaded for the same user; it only comes from setProfileStatus.
function withKnownRole(current: AuthUser | null, next: SessionUser): AuthUser {
  const same = current?.id === next.id;
  return {
    ...next,
    role: same ? current.role : null,
    hasPhone: same ? current.hasPhone : null,
  };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  // Supabase auth error code (or "unknown"); pages translate it via t.authErrors.
  error: string | null;
  isAuthenticated: boolean;
  confirmationRequired: boolean;
}

const token = localStorage.getItem("token");

const initialState: AuthState = {
  user: null,
  token: token,
  loading: false,
  error: null,
  isAuthenticated: !!token,
  confirmationRequired: false,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }: { email: string; password: string }) => {
    const data = await login(email, password);

    return {
      user: { id: data.user.id, email: data.user.email ?? "" },
      token: data.session.access_token,
    };
  }
);

interface SignUpArgs {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export const signUpUser = createAsyncThunk(
  "auth/signUpUser",
  async ({ email, password, name, phone }: SignUpArgs) => {
    const data = await signup(email, password, name, phone);

    if (!data.session || !data.user) {
      return { confirmationRequired: true as const };
    }

    // The user_data row is created by ensureUserProfile via the
    // SIGNED_IN listener in useAuthInit.
    return {
      confirmationRequired: false as const,
      user: { id: data.user.id, email: data.user.email ?? "" },
      token: data.session.access_token,
    };
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    await supabase.auth.signOut();

    dispatch(logout());
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<SessionUser>) {
      state.user = withKnownRole(state.user, action.payload);
      state.isAuthenticated = true;
    },
    // Ignored if another user has signed in since the profile was requested.
    setProfileStatus(
      state,
      action: PayloadAction<{ userId: string; role: string; hasPhone: boolean }>
    ) {
      if (state.user?.id === action.payload.userId) {
        state.user.role = action.payload.role;
        state.user.hasPhone = action.payload.hasPhone;
      }
    },   
    clearAuthError(state) {
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("token");
    },
  },
   extraReducers: (builder) => {
    builder

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = withKnownRole(state.user, action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = true;

        localStorage.setItem("token", action.payload.token);
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.code ?? "unknown";
      })

      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.confirmationRequired = false;
      })

      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload.confirmationRequired) {
          state.confirmationRequired = true;
          return;
        }

        state.user = withKnownRole(state.user, action.payload.user);
        state.token = action.payload.token;
        state.isAuthenticated = true;

        localStorage.setItem("token", action.payload.token);
      })

      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.code ?? "unknown";
      });
  },
});

export const { logout, setUser, setProfileStatus, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
