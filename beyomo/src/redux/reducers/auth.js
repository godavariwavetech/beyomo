import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const initialState = {
  message: null,
  loading: false,
  token: null,
  userId: null,
  isNew: false,
  user: null,
};

export const requestLoginOtp = createAsyncThunk(
  'auth/requestLoginOtp',
  async (phone, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.SEND_OTP, {
        phone,
        userType: 'user',
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to send OTP. Please try again.',
      );
    }
  },
);

export const verifyLoginOtp = createAsyncThunk(
  'auth/verifyLoginOtp',
  async ({phone, otp}, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.VERIFY_OTP, {
        phone,
        otp,
        userType: 'user',
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Invalid OTP. Please try again.',
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (deviceToken, {rejectWithValue}) => {
    try {
      await api.post(endpoints.LOGOUT, {deviceToken});
    } catch (_) {}
  },
);

export const AuthSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    actionLogout: state => {
      state.token = null;
      state.userId = null;
      state.user = null;
      state.message = null;
      state.isNew = false;
    },
    actionLogin: (state, action) => {
      state.token = action.payload?.token ?? null;
      state.userId = action.payload?.userId ?? null;
    },
    clearMessage: state => {
      state.message = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(requestLoginOtp.pending, state => {
        state.loading = true;
        state.message = null;
      })
      .addCase(requestLoginOtp.fulfilled, state => {
        state.loading = false;
      })
      .addCase(requestLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload ?? 'Please try again!';
      })

      .addCase(verifyLoginOtp.pending, state => {
        state.loading = true;
        state.message = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data;
        state.token = data?.token ?? null;
        state.userId = data?.user?._id ?? null;
        state.user = data?.user ?? null;
        state.isNew = data?.isNew ?? false;
        state.message = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload ?? 'Invalid OTP. Please try again.';
      })

      .addCase(logoutUser.fulfilled, state => {
        state.token = null;
        state.userId = null;
        state.user = null;
        state.isNew = false;
      });
  },
});

export const {actionLogout, actionLogin, clearMessage} = AuthSlice.actions;

export default AuthSlice.reducer;
