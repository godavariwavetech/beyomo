import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

export const fetchCategories = createAsyncThunk(
  'services/fetchCategories',
  // `params` defaults to {} so the existing no-argument callers keep working unchanged;
  // pass {cityId} to get only the categories offered in that city.
  async (params = {}, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.CATEGORIES, {params});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load categories.');
    }
  },
);

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async (params = {}, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.SERVICES, {params});
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load services.');
    }
  },
);

export const fetchNearbyPartners = createAsyncThunk(
  'services/fetchNearbyPartners',
  async ({lat, lng, serviceId} = {}, {rejectWithValue}) => {
    try {
      const response = await api.get(endpoints.NEARBY_PARTNERS, {
        params: {lat, lng, serviceId},
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load nearby partners.');
    }
  },
);

const servicesSlice = createSlice({
  name: 'services',
  initialState: {
    categories: [],
    services: [],
    nearbyPartners: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearServicesError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCategories.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload ?? [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchServices.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload ?? [];
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchNearbyPartners.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyPartners.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyPartners = action.payload ?? [];
      })
      .addCase(fetchNearbyPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {clearServicesError} = servicesSlice.actions;
export default servicesSlice.reducer;
