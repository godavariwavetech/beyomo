import {configureStore} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthReducer from './reducers/auth';
import PartnerReducer from './reducers/partner';
import NotificationsReducer from './reducers/notifications';
import CityReducer from './reducers/city';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['token', 'partnerId', 'partner'],
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
    Partner: PartnerReducer,
    Notifications: NotificationsReducer,
    City: persistedCity,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistorStore = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
