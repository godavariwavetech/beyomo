import React, {useEffect} from 'react';
import {Provider, useSelector, useDispatch} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import {store, persistorStore} from './src/redux/store';
import AppNavigation from './src/navigation/AppNavigation';
import {updatePartnerDeviceToken} from './src/redux/reducers/partner';
import {createNotificationChannels, getFCMToken} from './src/services/NotificationsService';

// Register background handler at module scope (required by RN Firebase)
messaging().setBackgroundMessageHandler(async () => {});

function AppContent() {
  const dispatch = useDispatch<any>();
  const token = useSelector((state: any) => state.Auth?.token);

  useEffect(() => {
    createNotificationChannels();
  }, []);

  useEffect(() => {
    if (!token) {
      console.log('[FCM] No auth token, skipping device token registration');
      return;
    }

    const register = async () => {
      try {
        console.log('[FCM] Requesting notification permissions...');
        const authStatus = await messaging().requestPermission();
        console.log('[FCM] Authorization status:', authStatus);

        const granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!granted) {
          console.log('[FCM] Permission denied or not granted');
          return;
        }

        const fcmToken = await getFCMToken();
        console.log('[FCM] Got FCM token:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');

        if (fcmToken) {
          console.log('[FCM] Registering device token with backend...');
          try {
            const result = await dispatch(updatePartnerDeviceToken(fcmToken) as any);
            if (result.type.endsWith('/fulfilled')) {
              console.log('[FCM] ✅ Device token registered successfully');
            } else if (result.type.endsWith('/rejected')) {
              console.log('[FCM] ❌ Failed to register device token:', result.payload);
            }
          } catch (error) {
            console.error('[FCM] Exception during device token registration:', error);
          }
        } else {
          console.log('[FCM] Failed to get FCM token');
        }
      } catch (error) {
        console.error('[FCM] Error during registration:', error);
      }
    };

    register();

    const unsubRefresh = messaging().onTokenRefresh(newToken => {
      console.log('[FCM] Token refreshed, registering new token...');
      dispatch(updatePartnerDeviceToken(newToken));
    });

    return () => unsubRefresh();
  }, [dispatch, token]);

  return <AppNavigation />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistorStore}>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
