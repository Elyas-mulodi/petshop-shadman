import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  user: null, 
  isAuthenticated: false,
  authChecked: false, 
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.authChecked = true;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    authCheckFinished: (state) => {
      state.authChecked = true;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.authChecked = true;
    },
  },
});

export const { setCredentials, setAccessToken, updateUser, authCheckFinished, logout } =
  authSlice.actions;

export default authSlice.reducer;