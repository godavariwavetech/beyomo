import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const fetchPartnerProfile = createAsyncThunk(
  'partner/fetchProfile',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PARTNER_PROFILE);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load profile.');
    }
  },
);

export const updatePartnerProfile = createAsyncThunk(
  'partner/updateProfile',
  async (profileData, {rejectWithValue}) => {
    try {
      const response = await api.patch(endpoints.PARTNER_PROFILE, profileData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update profile.');
    }
  },
);

export const fetchPartnerDashboard = createAsyncThunk(
  'partner/fetchDashboard',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PARTNER_DASHBOARD);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load dashboard.');
    }
  },
);

export const fetchPartnerBookings = createAsyncThunk(
  'partner/fetchBookings',
  async (params = {}, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PARTNER_BOOKINGS, {params});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load bookings.');
    }
  },
);

export const updateBookingStatus = createAsyncThunk(
  'partner/updateBookingStatus',
  async ({bookingId, status}, {rejectWithValue}) => {
    try {
      const response = await api.patch(
        `${endpoints.PARTNER_BOOKINGS}/${bookingId}/status`,
        {status},
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update booking status.');
    }
  },
);

export const fetchPartnerEarnings = createAsyncThunk(
  'partner/fetchEarnings',
  async (period = 'month', {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PARTNER_EARNINGS, {params: {period}});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load earnings.');
    }
  },
);

export const fetchAvailableBookings = createAsyncThunk(
  'partner/fetchAvailableBookings',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PARTNER_AVAILABLE_BOOKINGS);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load available bookings.');
    }
  },
);

export const updatePartnerDeviceToken = createAsyncThunk(
  'partner/updateDeviceToken',
  async (fcmToken, {rejectWithValue}) => {
    try {
      console.log('[REDUX] Updating device token:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');
      const response = await api.patch(endpoints.PARTNER_DEVICE_TOKEN, {fcmToken});
      console.log('[REDUX] Device token updated successfully');
      return response.data?.data || {message: 'Device token updated'};
    } catch (error) {
      console.error('[REDUX] Error updating device token:', error.message);
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update device token.');
    }
  },
);

const partnerSlice = createSlice({
  name: 'partner',
  initialState: {
    profile: null,
    dashboard: null,
    earnings: null,
    bookings: [],
    availableBookings: [],
    selectedBooking: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearPartnerError: state => {
      state.error = null;
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPartnerProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchPartnerProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updatePartnerProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })

      .addCase(fetchPartnerDashboard.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchPartnerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPartnerBookings.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload?.bookings ?? action.payload ?? [];
      })
      .addCase(fetchPartnerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAvailableBookings.fulfilled, (state, action) => {
        state.availableBookings = action.payload ?? [];
      })

      .addCase(updateBookingStatus.pending, state => {
        state.actionLoading = true;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload;
        const updatedId = updated?.id ?? updated?._id;
        if (updatedId) {
          state.bookings = state.bookings.map(b =>
            (b.id ?? b._id) === updatedId ? updated : b,
          );
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchPartnerEarnings.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerEarnings.fulfilled, (state, action) => {
        state.loading = false;
        state.earnings = action.payload;
      })
      .addCase(fetchPartnerEarnings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updatePartnerDeviceToken.fulfilled, (state, action) => {
        console.log('[REDUX] Device token fulfilled');
      })
      .addCase(updatePartnerDeviceToken.rejected, (state, action) => {
        console.error('[REDUX] Device token rejected:', action.payload);
        state.error = action.payload;
      });
  },
});

export const {clearPartnerError, setSelectedBooking} = partnerSlice.actions;
export default partnerSlice.reducer;
