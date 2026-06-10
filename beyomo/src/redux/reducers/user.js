import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.USER_PROFILE);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load profile.');
    }
  },
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, {rejectWithValue}) => {
    try {
      const response = await api.patch(endpoints.USER_PROFILE, profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update profile.');
    }
  },
);

export const addAddress = createAsyncThunk(
  'user/addAddress',
  async (addressData, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.USER_ADDRESS, addressData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to add address.');
    }
  },
);

export const updateAddress = createAsyncThunk(
  'user/updateAddress',
  async ({addressId, ...data}, {rejectWithValue}) => {
    try {
      const response = await api.put(`${endpoints.USER_ADDRESS}/${addressId}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update address.');
    }
  },
);

export const deleteAddress = createAsyncThunk(
  'user/deleteAddress',
  async (addressId, {rejectWithValue}) => {
    try {
      await api.delete(`${endpoints.USER_ADDRESS}/${addressId}`);
      return addressId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete address.');
    }
  },
);

export const fetchWallet = createAsyncThunk(
  'user/fetchWallet',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.USER_WALLET);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load wallet.');
    }
  },
);

// Fire-and-forget — never throws, never blocks the UI
export const updateDeviceToken = createAsyncThunk(
  'user/updateDeviceToken',
  async (fcmToken, {rejectWithValue}) => {
    try {
      const response = await api.patch(endpoints.USER_DEVICE_TOKEN, {fcmToken});
      return response.data?.data ?? {};
    } catch (_) {
      // Silently swallow — device token registration is best-effort
      return rejectWithValue(null);
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    wallet: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearUserError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload ?? state.profile;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
      })

      .addCase(updateProfile.pending, state => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? null;
      })

      .addCase(addAddress.pending, state => { state.actionLoading = true; state.error = null; })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) state.profile = action.payload;
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? null;
      })

      .addCase(updateAddress.pending, state => { state.actionLoading = true; state.error = null; })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) state.profile = action.payload;
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? null;
      })

      .addCase(deleteAddress.pending, state => { state.actionLoading = true; state.error = null; })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (state.profile?.addresses) {
          state.profile.addresses = state.profile.addresses.filter(
            a => (a._id ?? a.id) !== action.payload,
          );
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? null;
      })

      .addCase(fetchWallet.pending, state => { state.loading = true; })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload ?? state.wallet;
      })
      .addCase(fetchWallet.rejected, state => { state.loading = false; })

      // Device token is fire-and-forget — no state change needed on success or failure
      .addCase(updateDeviceToken.rejected, () => {});
  },
});

export const {clearUserError} = userSlice.actions;
export default userSlice.reducer;
