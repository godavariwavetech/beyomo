import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const parseServices = (s) => {
  if (Array.isArray(s)) return s;
  if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
  return [];
};

const normalizeBooking = (b) => b ? {...b, services: parseServices(b.services)} : b;

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUserBookings',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.USER_BOOKINGS);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load bookings.');
    }
  },
);

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId, {rejectWithValue}) => {
    try {
      const response = await api.get(`${endpoints.BOOKINGS}/${bookingId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load booking details.');
    }
  },
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.BOOKINGS, bookingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create booking.');
    }
  },
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async (bookingId, {rejectWithValue}) => {
    try {
      const response = await api.patch(`${endpoints.BOOKINGS}/${bookingId}/cancel`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to cancel booking.');
    }
  },
);

export const rescheduleBooking = createAsyncThunk(
  'bookings/rescheduleBooking',
  async ({bookingId, scheduledAt, reason}, {rejectWithValue}) => {
    try {
      const response = await api.patch(`${endpoints.BOOKINGS}/${bookingId}/reschedule`, {scheduledAt, reason});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to reschedule booking.');
    }
  },
);

export const respondServiceUpdate = createAsyncThunk(
  'bookings/respondServiceUpdate',
  async ({bookingId, action}, {rejectWithValue}) => {
    try {
      const response = await api.patch(endpoints.RESPOND_SERVICE_UPDATE(String(bookingId)), {action});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to respond to service update.');
    }
  },
);

export const addUserServices = createAsyncThunk(
  'bookings/addUserServices',
  async ({bookingId, services}, {rejectWithValue}) => {
    try {
      const response = await api.patch(endpoints.USER_ADD_SERVICES(String(bookingId)), {services});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to add services.');
    }
  },
);

export const submitReview = createAsyncThunk(
  'bookings/submitReview',
  async ({bookingId, rating, comment}, {rejectWithValue}) => {
    try {
      const response = await api.post(`${endpoints.BOOKINGS}/${bookingId}/review`, {
        rating,
        comment,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to submit review.');
    }
  },
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    list: [],
    selected: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearBookingsError: state => {
      state.error = null;
    },
    clearSelectedBooking: state => {
      state.selected = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserBookings.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.list = (action.payload ?? []).map(normalizeBooking);
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchBookingById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = normalizeBooking(action.payload);
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createBooking.pending, state => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          state.list = [normalizeBooking(action.payload), ...state.list];
        }
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(cancelBooking.pending, state => {
        state.actionLoading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.actionLoading = false;
        const cancelledId = action.payload?.id ?? action.payload?._id;
        if (cancelledId) {
          const normalized = normalizeBooking(action.payload);
          state.list = state.list.map(b =>
            (b.id ?? b._id) === cancelledId ? normalized : b,
          );
          if ((state.selected?.id ?? state.selected?._id) === cancelledId) {
            state.selected = normalized;
          }
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(rescheduleBooking.pending, state => {
        state.actionLoading = true;
      })
      .addCase(rescheduleBooking.fulfilled, (state, action) => {
        state.actionLoading = false;
        const rescheduledId = action.payload?.id ?? action.payload?._id;
        if (rescheduledId) {
          const normalized = normalizeBooking(action.payload);
          state.list = state.list.map(b =>
            (b.id ?? b._id) === rescheduledId ? normalized : b,
          );
          if ((state.selected?.id ?? state.selected?._id) === rescheduledId) {
            state.selected = normalized;
          }
        }
      })
      .addCase(rescheduleBooking.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(respondServiceUpdate.pending, state => {
        state.actionLoading = true;
      })
      .addCase(respondServiceUpdate.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const normalized = normalizeBooking(action.payload);
          state.selected = normalized;
          state.list = state.list.map(b =>
            (b.id ?? b._id) === (action.payload.id ?? action.payload._id) ? normalized : b,
          );
        }
      })
      .addCase(respondServiceUpdate.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      .addCase(addUserServices.pending, state => { state.actionLoading = true; })
      .addCase(addUserServices.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload) {
          const normalized = normalizeBooking(action.payload);
          state.selected = normalized;
          state.list = state.list.map(b =>
            (b.id ?? b._id) === (action.payload.id ?? action.payload._id) ? normalized : b,
          );
        }
      })
      .addCase(addUserServices.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {clearBookingsError, clearSelectedBooking} = bookingsSlice.actions;
export default bookingsSlice.reducer;
