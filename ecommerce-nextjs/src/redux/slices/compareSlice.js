import { createSlice } from '@reduxjs/toolkit';

const MAX_COMPARE = 4;

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: [], // Array of product objects (max 4)
  },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      const already = state.items.find((p) => p.id === product.id);
      if (already) return;
      if (state.items.length >= MAX_COMPARE) return;
      state.items.push(product);
    },
    removeFromCompare: (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
    clearCompare: (state) => {
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
