//https://redux-toolkit.js.org/tutorials/quick-start

import { configureStore } from "@reduxjs/toolkit";
import dashboardSlice from "../components/pages/dashboard/dashboardSlice";
import clearanceRequestSlice from "../components/pages/clearanceRequest/clearanceRequestSlice";
import complaintSlice from "../components/pages/complaint/complaintSlice";
import announcementSlice from "../components/pages/announcement/announcementSlice";

export const store = configureStore({
  reducer: {
    dashboard: dashboardSlice,
    clearanceRequest: clearanceRequestSlice,
    complaint: complaintSlice,
    announcement: announcementSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
