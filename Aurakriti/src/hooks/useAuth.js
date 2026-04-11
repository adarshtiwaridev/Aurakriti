import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import authService from "@/services/authService";
import {
  authInitialized,
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
  logout as logoutAction,
  clearError,
  initializeAuth,
} from "@/redux/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    initialized,
  } = useSelector((state) => state.auth);

  // Initialize auth on app start using cookie-based session
  useEffect(() => {
    if (initialized) {
      return;
    }

    const initializeAuthState = async () => {
      try {
        const response = await authService.fetchMe();
        if (response?.user) {
          dispatch(initializeAuth({
            user: response.user,
            token: 'cookie',
          }));
          return;
        }
      } catch (error) {
        // No session or invalid token; leave auth state empty.
      } finally {
        dispatch(authInitialized());
      }
    };

    initializeAuthState();
  }, [dispatch, initialized]);

  const login = async (credentials) => {
    try {
      dispatch(loginStart());
      const response = await authService.login(credentials);
      dispatch(loginSuccess(response));
      return response;
    } catch (error) {
      dispatch(loginFailure(error.message || error.error || 'Login failed'));
      throw error;
    }
  };

  const demoLogin = async () => {
    try {
      dispatch(loginStart());
      const response = await authService.demoLogin();
      dispatch(loginSuccess(response));
      return response;
    } catch (error) {
      dispatch(loginFailure(error.error || 'Demo login failed'));
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch(registerStart());
      const response = await authService.register(userData);
      dispatch(registerSuccess(response));
      return response;
    } catch (error) {
      dispatch(registerFailure(error.message || error.error || 'Registration failed'));
      throw error;
    }
  };

  const verifyEmail = async (email, otp) => {
    try {
      dispatch(verifyEmailStart());
      const response = await authService.verifyEmail(email, otp);
      dispatch(verifyEmailSuccess());
      return response;
    } catch (error) {
      dispatch(verifyEmailFailure(error.message || error.error || 'Email verification failed'));
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      dispatch(forgotPasswordStart());
      const response = await authService.forgotPassword(email);
      dispatch(forgotPasswordSuccess());
      return response;
    } catch (error) {
      dispatch(forgotPasswordFailure(error.message || error.error || 'Failed to send reset email'));
      throw error;
    }
  };

  const resetPassword = async (email, otp, password) => {
    try {
      dispatch(resetPasswordStart());
      const response = await authService.resetPassword(email, otp, password);
      dispatch(resetPasswordSuccess());
      return response;
    } catch (error) {
      dispatch(resetPasswordFailure(error.message || error.error || 'Password reset failed'));
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    dispatch(logoutAction());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  // Helper methods
  const hasRole = (role) => {
    return user && user.role === role;
  };

  const isAdmin = () => hasRole('admin');
  const isSeller = () => hasRole('seller');
  const isUser = () => hasRole('user');

  return {
    // State
    user,
    token,
    loading,
    error,
    isAuthenticated,
    initialized,

    // Actions
    login,
    demoLogin,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    logout,
    clearAuthError,

    // Helpers
    hasRole,
    isAdmin,
    isSeller,
    isUser,
  };
};
