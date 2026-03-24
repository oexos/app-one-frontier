import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  productId: number;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
}

interface SellState {
  cartItems: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  isCartOpen: boolean;
}

const initialState: SellState = {
  cartItems: [],
  cartTotal: 0,
  cartItemCount: 0,
  isCartOpen: false,
};

const recalcTotals = (state: SellState) => {
  state.cartTotal = state.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  state.cartItemCount = state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
};

const sellSlice = createSlice({
  name: "sell",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ productId: number; productName: string; sellingPrice: number; costPrice: number; availableStock: number }>) => {
      const { productId, productName, sellingPrice, costPrice, availableStock } = action.payload;
      const existing = state.cartItems.find((item) => item.productId === productId);
      if (existing) {
        if (existing.quantity < availableStock) {
          existing.quantity += 1;
          existing.subtotal = existing.sellingPrice * existing.quantity;
        }
      } else {
        if (availableStock > 0) {
          state.cartItems.push({
            productId,
            productName,
            sellingPrice,
            costPrice,
            quantity: 1,
            availableStock,
            subtotal: sellingPrice,
          });
        }
      }
      recalcTotals(state);
    },
    incrementItem: (state, action: PayloadAction<number>) => {
      const item = state.cartItems.find((i) => i.productId === action.payload);
      if (item && item.quantity < item.availableStock) {
        item.quantity += 1;
        item.subtotal = item.sellingPrice * item.quantity;
        recalcTotals(state);
      }
    },
    decrementItem: (state, action: PayloadAction<number>) => {
      const item = state.cartItems.find((i) => i.productId === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          item.subtotal = item.sellingPrice * item.quantity;
        } else {
          state.cartItems = state.cartItems.filter((i) => i.productId !== action.payload);
        }
        recalcTotals(state);
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.cartItems = state.cartItems.filter((i) => i.productId !== action.payload);
      recalcTotals(state);
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.cartTotal = 0;
      state.cartItemCount = 0;
      state.isCartOpen = false;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
  },
});

export const { addToCart, incrementItem, decrementItem, removeFromCart, clearCart, setCartOpen } = sellSlice.actions;
export default sellSlice.reducer;
