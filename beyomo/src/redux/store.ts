import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthReducer from './reducers/auth';
import ServicesReducer from './reducers/services';
import BookingsReducer from './reducers/bookings';
import UserReducer from './reducers/user';
import NotificationsReducer from './reducers/notifications';
import PaymentsReducer from './reducers/payments';
import CityReducer from './reducers/city';
import CartReducer from './reducers/cart';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['token', 'userId', 'user'],
};

const cityPersistConfig = {
  key: 'city',
  storage: AsyncStorage,
  whitelist: ['selectedCity'],
};

const persistedAuth = persistReducer(authPersistConfig, AuthReducer);
const persistedCity = persistReducer(cityPersistConfig, CityReducer);

export const store = configureStore({
  reducer: {
    Auth: persistedAuth,
    Services: ServicesReducer,
    Bookings: BookingsReducer,
    User: UserReducer,
    Notifications: NotificationsReducer,
    Payments: PaymentsReducer,
    City: persistedCity,
    Cart: CartReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistorStore = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
