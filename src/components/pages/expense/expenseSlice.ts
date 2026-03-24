import { createSlice } from "@reduxjs/toolkit";

interface ExpenseState {
  refreshTrigger: number;
}

const initialState: ExpenseState = {
  refreshTrigger: 0,
};

const expenseSlice = createSlice({
  name: "expense",
  initialState,
  reducers: {
    triggerExpenseRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
});

export const { triggerExpenseRefresh } = expenseSlice.actions;
export default expenseSlice.reducer;
