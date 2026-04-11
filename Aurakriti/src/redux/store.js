import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import compareReducer from "./slices/compareSlice";

const loadState = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    const serializedState = window.localStorage.getItem('ecoCommerceState');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
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
  },
  preloadedState: loadState(),
});

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    saveState(store.getState());
  });
} 