import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import compareReducer from "./slices/compareSlice";
import wishlistReducer from './slices/wishlistSlice';

const AUTH_STORAGE_KEY = 'ecoCommerceAuth';

const loadState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const serializedState = window.localStorage.getItem('ecoCommerceState');
    if (serializedState === null) return undefined;
    const persistedState = JSON.parse(serializedState) || {};

    const serializedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const persistedAuth = serializedAuth ? JSON.parse(serializedAuth) : null;

    return {
      ...persistedState,
      ...(persistedAuth ? { auth: persistedAuth } : {}),
    };
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return undefined;
  }
};

const saveState = (state) => {
  if (typeof window === 'undefined') return;
  try {
    const serializedState = JSON.stringify({ cart: state.cart });
    window.localStorage.setItem('ecoCommerceState', serializedState);

    const authState = state.auth?.isAuthenticated
      ? {
          user: state.auth.user,
          token: state.auth.token || 'cookie',
          isAuthenticated: true,
          initialized: true,
          loading: false,
          error: null,
        }
      : {
          user: null,
          token: null,
          isAuthenticated: false,
          initialized: true,
          loading: false,
          error: null,
        };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    cart: cartReducer,
    compare: compareReducer,
    wishlist: wishlistReducer,
  },
  preloadedState: loadState(),
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    saveState(store.getState());
  });
} 
