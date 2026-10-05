import React from 'react';
import {Platform} from 'react-native';
import {useSelector} from 'react-redux';
import {store} from '../redux/store';
import LoginScreen from '../screens/Auth/LoginScreen';

// Android keeps its existing startup destination and authentication behaviour.
export const browsingDestination = (token: unknown) =>
  Platform.OS === 'ios' || token ? 'Main' : 'Login';

export const isIOSGuest = (token: unknown) => Platform.OS === 'ios' && !token;

// Reserved for protected account actions; browsing and cart edits stay public.
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

// Clear auth screens after login while keeping the Redux cart and checkout details.
export const finishAuthentication = (navigation: any, returnToCheckout?: boolean) => {
  if (Platform.OS === 'ios' && returnToCheckout) {
    let root = navigation;
    while (root?.getParent?.()) root = root.getParent();
    const checkout = root?.getState?.()?.routes?.find((route: any) => route.name === 'AddressPayment');
    root?.reset({
      index: 1,
      routes: [{name: 'Main'}, checkout ?? {name: 'AddressPayment'}],
    });
    return true;
  }
  return false;
};
