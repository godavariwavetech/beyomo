import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {Provider, useSelector, useDispatch} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import {store, persistorStore} from './src/redux/store';
import AppNavigation from './src/navigation/AppNavigation';
import {updateDeviceToken} from './src/redux/reducers/user';
import {createNotificationChannels, getFCMToken} from './src/services/NotificationsService';

// Register background handler at module scope (required by RN Firebase)
messaging().setBackgroundMessageHandler(async () => {});

class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  {hasError: boolean; errorMessage: string}
> {
  state = {hasError: false, errorMessage: ''};

  static getDerivedStateFromError(error: Error) {
    return {hasError: true, errorMessage: error?.message ?? 'Unknown error'};
  }

  componentDidCatch() {
    // Error is captured silently — no crash, no white screen
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops, something went wrong</Text>
          <Text style={styles.errorSub}>
            We hit an unexpected snag. Tap below to recover.
          </Text>
          <TouchableOpacity
            style={styles.errorBtn}
            activeOpacity={0.8}
            onPress={() => this.setState({hasError: false, errorMessage: ''})}>
            <Text style={styles.errorBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent(): React.JSX.Element {
  const dispatch = useDispatch<any>();
  const token = useSelector((state: any) => state.Auth?.token);

  useEffect(() => {
    try {
      createNotificationChannels();
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!token) return;

    // Fire-and-forget — never block or crash on FCM failures
    (async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!granted) return;

        const fcmToken = await getFCMToken();
        if (fcmToken) {
          dispatch(updateDeviceToken(fcmToken));
        }
      } catch (_) {}
    })();

    const unsubRefresh = messaging().onTokenRefresh(newToken => {
      try { dispatch(updateDeviceToken(newToken)); } catch (_) {}
    });

    return () => { try { unsubRefresh(); } catch (_) {} };
  }, [dispatch, token]);

  return <AppNavigation />;
}

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistorStore}>
          <SafeAreaProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171816',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  errorBtn: {
    backgroundColor: '#105641',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 36,
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default App;
