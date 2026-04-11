import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  loading: false,
  error: null,
  hydrated: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          id: item.id,
          title: item.name || item.title,
          price: item.price,
          image: item.image,
          quantity: 1,
        });
      }
      state.hydrated = true;
    },
    incrementQuantity: (state, action) => {
      const item = state.items.find((cartItem) => cartItem.id === action.payload);
      if (item) item.quantity += 1;
      state.hydrated = true;
    },
    decrementQuantity: (state, action) => {
      const item = state.items.find((cartItem) => cartItem.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
      state.hydrated = true;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.hydrated = true;
    },
    clearCart: (state) => {
      state.items = [];
      state.hydrated = true;
    },
    setCart: (state, action) => {
      state.items = action.payload ?? [];
      state.loading = false;
      state.error = null;
      state.hydrated = true;
    },
    setCartLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCartError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.hydrated = true;
    },
  },
});

export const {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
  setCart,
  setCartLoading,
  setCartError,
} = cartSlice.actions;
export default cartSlice.reducer;
