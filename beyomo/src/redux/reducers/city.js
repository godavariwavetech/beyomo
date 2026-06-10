import {createSlice} from '@reduxjs/toolkit';

const citySlice = createSlice({
  name: 'City',
  initialState: {
    selectedCity: null, // { id, name, state, lat, lng, radius }
  },
  reducers: {
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload;
    },
    clearSelectedCity: state => {
      state.selectedCity = null;
    },
  },
});

export const {setSelectedCity, clearSelectedCity} = citySlice.actions;
export default citySlice.reducer;
