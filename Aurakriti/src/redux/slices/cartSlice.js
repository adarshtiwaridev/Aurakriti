import { createSlice } from "@reduxjs/toolkit";

const normalizeCartItem = (item = {}) => {
  const productId = String(item.productId ?? item.product?.id ?? item.product?._id ?? item.id ?? "");
  const cartItemId = String(item.cartItemId ?? item.id ?? productId);
  const source = item.source || (item.isPersisted || (cartItemId !== productId && !!productId) ? "server" : "local");

  return {
    ...item,
    id: cartItemId,
    cartItemId,
    productId,
    title: item.title || item.name || "Product",
    price: Number(item.price || 0),
    image: item.image || item.images?.[0] || "",
    quantity: Math.max(1, Number(item.quantity) || 1),
    source,
    isPersisted: source === "server",
  };
};

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
      const item = normalizeCartItem(action.payload);
      const existingItem = state.items.find(
        (cartItem) => cartItem.productId === item.productId && cartItem.source === item.source
      );
      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        state.items.push(item);
      }
      state.hydrated = true;
    },
    incrementQuantity: (state, action) => {
      const item = state.items.find(
        (cartItem) => cartItem.id === action.payload || cartItem.cartItemId === action.payload
      );
      if (item) item.quantity += 1;
      state.hydrated = true;
    },
    decrementQuantity: (state, action) => {
      const item = state.items.find(
        (cartItem) => cartItem.id === action.payload || cartItem.cartItemId === action.payload
      );
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
      state.hydrated = true;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload && item.cartItemId !== action.payload
      );
      state.hydrated = true;
    },
    clearCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.hydrated = true;
    },
    setCart: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload.map(normalizeCartItem) : [];
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
