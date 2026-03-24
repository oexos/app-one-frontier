import { createSlice } from "@reduxjs/toolkit";

interface ReportState {
  refreshTrigger: number;
}

const initialState: ReportState = {
  refreshTrigger: 0,
};

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    triggerReportRefresh: (state) => {
      state.refreshTrigger += 1;
    },
  },
});

export const { triggerReportRefresh } = reportSlice.actions;
export default reportSlice.reducer;
