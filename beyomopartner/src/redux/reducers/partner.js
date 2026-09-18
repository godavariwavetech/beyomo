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
      // The Jobs screen slices this one response into Available/Upcoming/Completed on the
      // client, so it needs the partner's whole history, not the API's default first page.
      // With the default 10 - ordered by scheduledAt DESC - a partner whose ten most recent
      // jobs are all completed saw "No upcoming jobs found" while still holding confirmed
      // work. An explicit param from a caller still wins.
      const response = await api.get(endpoints.PARTNER_BOOKINGS, {params: {limit: 200, ...params}});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load bookings.');
    }
  },
);

export const updateBookingStatus = createAsyncThunk(
  'partner/updateBookingStatus',
  async ({bookingId, status, cashCollected}, {rejectWithValue}) => {
    try {
      const response = await api.patch(
        `${endpoints.PARTNER_BOOKINGS}/${bookingId}/status`,
        cashCollected !== undefined ? {status, cashCollected} : {status},
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update booking status.');
    }
  },
);

export const markPartnerArrived = createAsyncThunk(
  'partner/markArrived',
  async (bookingId, {rejectWithValue}) => {
    try {
      const response = await api.patch(endpoints.PARTNER_BOOKING_ARRIVED(String(bookingId)));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to record arrival.');
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

export const fetchPartnerWallet = createAsyncThunk(
  'partner/fetchWallet',
  async ({page = 1, limit = 20} = {}, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PARTNER_WALLET, {params: {page, limit}});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load wallet.');
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

const initialState = {
    profile: null,
    dashboard: null,
    earnings: null,
    // Earnings are cached per period ('week' | 'month' | 'all'). Keying by period means a
    // slow response for the tab you just left can no longer overwrite the tab you are on,
    // and switching tabs shows the last known figures instead of blanking to placeholders.
    earningsByPeriod: {},
    earningsLoading: false,
    wallet: null,
    bookings: [],
    availableBookings: [],
    selectedBooking: null,
    loading: false,
  actionLoading: false,
  error: null,
};

const partnerSlice = createSlice({
  name: 'partner',
  initialState,
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
      // Wipe every trace of the signed-out partner. Without this, profile/dashboard/
      // bookings survive logout in memory and the next screen to mount renders the
      // previous partner's data.
      .addCase('auth/actionLogout', () => initialState)
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

      .addCase(markPartnerArrived.pending, state => {
        state.actionLoading = true;
      })
      .addCase(markPartnerArrived.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updated = action.payload;
        const updatedId = updated?.id ?? updated?._id;
        if (updatedId) {
          state.bookings = state.bookings.map(b =>
            (b.id ?? b._id) === updatedId ? updated : b,
          );
        }
      })
      .addCase(markPartnerArrived.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchPartnerEarnings.pending, state => {
        state.earningsLoading = true;
        state.error = null;
      })
      .addCase(fetchPartnerEarnings.fulfilled, (state, action) => {
        state.earningsLoading = false;
        const period = action.payload?.period ?? action.meta.arg ?? 'month';
        state.earningsByPeriod[period] = action.payload;
        state.earnings = action.payload;
      })
      .addCase(fetchPartnerEarnings.rejected, (state, action) => {
        state.earningsLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchPartnerWallet.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartnerWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchPartnerWallet.rejected, (state, action) => {
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
