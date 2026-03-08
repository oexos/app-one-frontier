//https://redux-toolkit.js.org/tutorials/quick-start

import { configureStore } from "@reduxjs/toolkit";
import sessionSlice from "../components/pages/session/sessionSlice";

export const store = configureStore({
  reducer: { session: sessionSlice },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
