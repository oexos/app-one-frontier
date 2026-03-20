import { createSlice } from "@reduxjs/toolkit";

interface DashboardState {
  refreshTrigger: number;
}

const initialState: DashboardState = {
  refreshTrigger: 0,
};

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    triggerRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
});

export const { triggerRefresh } = dashboardSlice.actions;
export default dashboardSlice.reducer;
