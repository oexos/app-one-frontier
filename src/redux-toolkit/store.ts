import { configureStore } from "@reduxjs/toolkit";
import sellSlice from "../components/pages/sell/sellSlice";
import productSlice from "../components/pages/product/productSlice";
import reportSlice from "../components/pages/report/reportSlice";
import expenseSlice from "../components/pages/expense/expenseSlice";

export const store = configureStore({
  reducer: {
    sell: sellSlice,
    product: productSlice,
    report: reportSlice,
    expense: expenseSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
