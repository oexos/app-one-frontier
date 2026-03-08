import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
//https://redux-toolkit.js.org/tutorials/quick-start
export interface SessionState {
  isShowSessionForm: boolean;
  isTriggerSessionSearching: boolean;
}

const initialState: SessionState = {
  isShowSessionForm: false,
  isTriggerSessionSearching: false,
};

export const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setIsShowSessionForm: (state, action: PayloadAction<boolean>) => {
      state.isShowSessionForm = action.payload;
    },
    setIsTriggerSessionSearching: (state, action: PayloadAction<boolean>) => {
      state.isTriggerSessionSearching = action.payload;
    },
  },
});

export const { setIsShowSessionForm, setIsTriggerSessionSearching } =
  sessionSlice.actions;

export default sessionSlice.reducer;
