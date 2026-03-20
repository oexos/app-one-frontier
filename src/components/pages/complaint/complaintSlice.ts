import { createSlice } from "@reduxjs/toolkit";

interface ComplaintState {
  refreshTrigger: number;
  showCreateForm: boolean;
}

const initialState: ComplaintState = {
  refreshTrigger: 0,
  showCreateForm: false,
};

export const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    triggerComplaintRefresh: (state) => {
      state.refreshTrigger += 1;
    },
    setShowComplaintForm: (state, action) => {
      state.showCreateForm = action.payload;
    },
  },
});

export const { triggerComplaintRefresh, setShowComplaintForm } = complaintSlice.actions;
export default complaintSlice.reducer;
