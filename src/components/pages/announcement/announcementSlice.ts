import { createSlice } from "@reduxjs/toolkit";

interface AnnouncementState {
  refreshTrigger: number;
  showCreateForm: boolean;
}

const initialState: AnnouncementState = {
  refreshTrigger: 0,
  showCreateForm: false,
};

export const announcementSlice = createSlice({
  name: "announcement",
  initialState,
  reducers: {
    triggerAnnouncementRefresh: (state) => {
      state.refreshTrigger += 1;
    },
    setShowAnnouncementForm: (state, action) => {
      state.showCreateForm = action.payload;
    },
  },
});

export const { triggerAnnouncementRefresh, setShowAnnouncementForm } = announcementSlice.actions;
export default announcementSlice.reducer;
