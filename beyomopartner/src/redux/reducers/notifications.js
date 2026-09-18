import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, {rejectWithValue}) => {
    try {
      // Return the whole body: it carries BOTH the rows (data) and unreadCount, and the
      // reducer needs both. Returning response.data.data handed back a bare array, whose
      // .unreadCount/.notifications are undefined - which is why the bell list stayed empty.
      const response = await api.get(endpoints.NOTIFICATIONS);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load notifications.');
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (notificationId, {rejectWithValue}) => {
    try {
      await api.patch(`${endpoints.NOTIFICATIONS}/${notificationId}/read`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to mark as read.');
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, {rejectWithValue}) => {
    try {
      await api.patch(`${endpoints.NOTIFICATIONS}/read-all`);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to mark all as read.');
    }
  },
);

const initialState = {
  list: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationsError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Notifications belong to the partner who was signed in - drop them on logout.
      .addCase('auth/actionLogout', () => initialState)
      .addCase(fetchNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data ?? [];
        state.unreadCount = action.payload?.unreadCount ?? 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notif = state.list.find(n => n._id === id);
        if (notif && !notif.isRead) {
          notif.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      .addCase(markAllNotificationsRead.fulfilled, state => {
        state.list = state.list.map(n => ({...n, isRead: true}));
        state.unreadCount = 0;
      });
  },
});

export const {clearNotificationsError} = notificationsSlice.actions;
export default notificationsSlice.reducer;
