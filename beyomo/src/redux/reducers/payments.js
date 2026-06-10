import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const createPaymentOrder = createAsyncThunk(
  'payments/createOrder',
  async (orderData, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.PAYMENT_CREATE_ORDER, orderData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create payment order.');
    }
  },
);

export const verifyPayment = createAsyncThunk(
  'payments/verifyPayment',
  async (paymentData, {rejectWithValue}) => {
    try {
      const response = await api.post(endpoints.PAYMENT_VERIFY, paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Payment verification failed.');
    }
  },
);

export const fetchPaymentHistory = createAsyncThunk(
  'payments/fetchHistory',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.PAYMENT_HISTORY);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load payment history.');
    }
  },
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    currentOrder: null,
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentOrder: state => {
      state.currentOrder = null;
    },
    clearPaymentsError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createPaymentOrder.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyPayment.pending, state => {
        state.loading = true;
      })
      .addCase(verifyPayment.fulfilled, state => {
        state.loading = false;
        state.currentOrder = null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.history = action.payload ?? [];
      });
  },
});

export const {clearCurrentOrder, clearPaymentsError} = paymentsSlice.actions;
export default paymentsSlice.reducer;
