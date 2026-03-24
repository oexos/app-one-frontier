import { createSlice } from "@reduxjs/toolkit";

interface ProductState {
  refreshTrigger: number;
}

const initialState: ProductState = {
  refreshTrigger: 0,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    triggerProductRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
});

export const { triggerProductRefresh } = productSlice.actions;
export default productSlice.reducer;
