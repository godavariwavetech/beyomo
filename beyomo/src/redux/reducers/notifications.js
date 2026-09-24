import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.NOTIFICATIONS);
      // The API returns { data: [...notifications], unreadCount } — `data` is the
      // array directly, not `{ notifications: [...] }`. The reducer below expects
      // that nested shape, so this reshapes the payload to match it; returning the
      // raw array left `action.payload.notifications` (and `.unreadCount`) always
      // undefined, which meant the notifications list was always empty regardless
      // of how many notifications actually existed.
      return {
        notifications: response.data?.data ?? [],
        unreadCount: response.data?.unreadCount ?? 0,
      };
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

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearNotificationsError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.notifications ?? [];
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
