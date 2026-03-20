import { createSlice } from "@reduxjs/toolkit";

interface ClearanceRequestState {
  refreshTrigger: number;
  showCreateForm: boolean;
}

const initialState: ClearanceRequestState = {
  refreshTrigger: 0,
  showCreateForm: false,
};

export const clearanceRequestSlice = createSlice({
  name: "clearanceRequest",
  initialState,
  reducers: {
    triggerClearanceRefresh: (state) => {
      state.refreshTrigger += 1;
    },
    setShowCreateForm: (state, action) => {
      state.showCreateForm = action.payload;
    },
  },
});

export const { triggerClearanceRefresh, setShowCreateForm } = clearanceRequestSlice.actions;
export default clearanceRequestSlice.reducer;
