import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Login actions
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || 'cookie';
      state.loading = false;
      state.isAuthenticated = true;
      state.error = null;
      state.initialized = true;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.initialized = true;
    },

    // Register actions
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
      state.token = null;
      state.initialized = true;
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.initialized = true;
    },

    // Verify email actions
    verifyEmailStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    verifyEmailSuccess: (state, action) => {
      if (state.user) {
        state.user.isVerified = true;
      }
      state.loading = false;
      state.error = null;
    },
    verifyEmailFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Forgot password actions
    forgotPasswordStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    forgotPasswordSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    forgotPasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Reset password actions
    resetPasswordStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    resetPasswordSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    resetPasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.isAuthenticated = false;
      state.error = null;
      state.initialized = true;
    },

    // Update user
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Initialize auth from server session
    initializeAuth: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || 'cookie';
      state.isAuthenticated = true;
      state.initialized = true;
    },
    authInitialized: (state) => {
      state.initialized = true;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  verifyEmailStart,
  verifyEmailSuccess,
  verifyEmailFailure,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,
  logout,
  updateUser,
  clearError,
  initializeAuth,
  authInitialized,
} = authSlice.actions;

export default authSlice.reducer;
