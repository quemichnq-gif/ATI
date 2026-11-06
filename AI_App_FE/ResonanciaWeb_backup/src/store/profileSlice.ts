import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile } from '../types';

const initialState: UserProfile = {
  uid: '',
  name: '',
  email: '',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (_, action: PayloadAction<UserProfile>) => action.payload,
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      return { ...state, ...action.payload };
    },
    clearProfile: () => initialState,
  },
});

export const { setProfile, updateProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
