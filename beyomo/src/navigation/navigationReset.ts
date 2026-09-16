/**
 * Makes `routeName` the only screen in the history.
 *
 * `navigate`/`replace` leave the screens underneath in place, so Android's hardware
 * back button walks back across an auth boundary that was just crossed — out of a
 * signed-in session, or back onto a spent OTP/phone-number page. The reset has to land
 * on the *root* stack: from a tab screen (Profile) the screen's own navigation object
 * belongs to the tab navigator, which has no auth routes at all — so climb to the
 * outermost navigator first.
 */
export const resetTo = (navigation: any, routeName: string) => {
  let root = navigation;
  while (root?.getParent?.()) {
    root = root.getParent();
  }
  root?.reset({index: 0, routes: [{name: routeName}]});
};

/** Signs the user out to Login with nothing left behind it. */
export const resetToLogin = (navigation: any) => resetTo(navigation, 'Login');
