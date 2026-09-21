import {createNavigationContainerRef, CommonActions} from '@react-navigation/native';

/**
 * Navigation ref shared by the navigator and by code that lives outside React —
 * most importantly the axios 401 interceptor, which has no access to a navigation
 * prop but must still be able to throw the user out.
 */
export const navigationRef = createNavigationContainerRef<any>();

/**
 * Sends the user to Login and DISCARDS the entire navigation history.
 *
 * This has to be a reset, not navigate() or replace(). The app uses one flat stack
 * holding both the auth screens and the signed-in screens, so:
 *   - navigate('Login') pushes Login on top of Main/JobDetails/Profile, and
 *   - replace('Login') swaps only the current screen,
 * either way leaving the signed-in screens underneath. The hardware back button then
 * pops straight back into the previous partner's profile and bookings.
 *
 * Resetting to a single-entry stack means there is nothing left to go back to.
 */
export const resetToLogin = () => {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{name: 'Login'}],
    }),
  );
};

/**
 * Sends the user into the app and DISCARDS the entire auth-flow history (Login, OTP,
 * Register, AccountStatus), for the same reason resetToLogin exists above:
 * navigation.replace('Main') only swaps the current screen, leaving those auth screens
 * underneath — the hardware back button then pops straight back into the phone-number
 * screen instead of exiting the app.
 */
export const resetToMain = () => {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{name: 'Main'}],
    }),
  );
};
