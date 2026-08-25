import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { login, signup } from "../../api/auth";
import { createProfile } from "../../api/users";
import { supabase } from "../../lib/supabase";
import { ensureUserProfile } from "./ensureUserProfile";

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
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

    localStorage.setItem("token", data.session.access_token);
    ensureUserProfile(data.user);

    return {
       user: {
        id: data.user.id,
        email: data.user.email ?? "",
        role:data.user.role ?? "user",
      },
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

    localStorage.setItem("token", data.session.access_token);
    await createProfile({ name, phone });

    return {
      confirmationRequired: false as const,
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        role: data.user.role ?? "user",
      },
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
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isAuthenticated = true;
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

        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;

        localStorage.setItem("token", action.payload.token);
      })

      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
        state.error = "Login failed";
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

        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;

        localStorage.setItem("token", action.payload.token);
      })

      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Sign up failed";
      });
  },
});

export const { logout, setUser } = authSlice.actions;

export default authSlice.reducer;
