import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const refreshPartnerStatus = createAsyncThunk(
  'auth/refreshPartnerStatus',
  async (_, {rejectWithValue}) => {
    try {
      const res = await api.get(endpoints.PARTNER_PROFILE);
      return res.data?.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message ?? 'Failed to refresh');
    }
  },
);

const initialState = {
  message: null,
  loading: false,
  token: null,
  partnerId: null,
  isNew: false,
  partner: null,
};

export const requestLoginOtp = createAsyncThunk(
  'auth/requestLoginOtp',
  async (phone, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.SEND_OTP, {
        phone,
        userType: 'partner',
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
        userType: 'partner',
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Invalid OTP. Please try again.',
      );
    }
  },
);

export const logoutPartner = createAsyncThunk(
  'auth/logoutPartner',
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
      state.partnerId = null;
      state.partner = null;
      state.message = null;
      state.isNew = false;
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
        state.partnerId = data?.partner?._id ?? null;
        state.partner = data?.partner ?? null;
        state.isNew = data?.isNew ?? false;
        state.message = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.message = action.payload ?? 'Invalid OTP. Please try again.';
      })

      .addCase(logoutPartner.fulfilled, state => {
        state.token = null;
        state.partnerId = null;
        state.partner = null;
        state.isNew = false;
      })

      .addCase(refreshPartnerStatus.fulfilled, (state, action) => {
        if (action.payload) state.partner = action.payload;
      });
  },
});

export const {actionLogout, clearMessage} = AuthSlice.actions;

export default AuthSlice.reducer;
