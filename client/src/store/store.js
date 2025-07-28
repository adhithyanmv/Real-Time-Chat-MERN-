import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import usersReducer from "./usersSlice";
import messagesReducer from "./messagesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    messages: messagesReducer,
  },
});
