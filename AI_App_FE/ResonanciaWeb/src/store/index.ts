import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './profileSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
