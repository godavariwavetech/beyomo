import React from 'react';
import {Platform} from 'react-native';
import {useSelector} from 'react-redux';
import {store} from '../redux/store';
import LoginScreen from '../screens/Auth/LoginScreen';

// Android keeps its existing startup destination and authentication behaviour.
export const browsingDestination = (token: unknown) =>
  Platform.OS === 'ios' || token ? 'Main' : 'Login';

export const isIOSGuest = (token: unknown) => Platform.OS === 'ios' && !token;

// Check at the action boundary, before adding anything to the shared cart.
export const requireIOSAuthentication = (navigation: any) => {
  if (Platform.OS !== 'ios') return true;
  if (!isIOSGuest(store.getState().Auth?.token)) return true;
  navigation?.navigate('Login');
  return false;
};

// Reuse the existing login UI without mounting account screens or their requests.
// Returning the original component on Android also preserves component identity.
export const withIOSAuthentication = (Screen: React.ComponentType<any>) => {
  if (Platform.OS !== 'ios') return Screen;
  const AuthenticatedScreen = (props: any) => {
    const token = useSelector((state: any) => state.Auth?.token);
    return token ? <Screen {...props} /> : <LoginScreen {...props} />;
  };
  return AuthenticatedScreen;
};
