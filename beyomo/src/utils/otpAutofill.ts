import {NativeModules, Platform} from 'react-native';

const native = NativeModules.OtpAutofill;
const available = Platform.OS === 'android' && !!native;

/**
 * Asks Android to re-open the autofill session on the focused field, so the SMS code
 * shows up as a suggestion above the keyboard. See OtpAutofillModule.kt for why a
 * single ask at focus time isn't enough.
 *
 * Safe to call at any time — resolves false when there is no autofill service, no
 * focused field, or the platform is not Android.
 */
export const requestOtpAutofill = async (): Promise<boolean> => {
  if (!available) return false;
  try {
    return await native.requestAutofill();
  } catch {
    return false;
  }
};

/** Closes any open autofill session, so a stale dropdown doesn't linger over the UI. */
export const cancelOtpAutofill = async (): Promise<void> => {
  if (!available) return;
  try {
    await native.cancel();
  } catch {
    /* nothing open */
  }
};

/**
 * Nudges every few seconds for `windowMs`, backing off as it goes: the SMS usually
 * lands within ten seconds but can take much longer on a congested route, and there is
 * no signal to wait on — the autofill provider never tells us when it has seen one.
 *
 * The window outlasts the 30s resend timer on purpose, so a code that arrives late is
 * still offered rather than leaving the user to re-send and wait again.
 *
 * Returns a function that stops the remaining attempts; call it as soon as the field
 * has a value, so the dropdown stops reappearing over someone typing by hand.
 */
export const pollOtpAutofill = (windowMs = 60000): (() => void) => {
  if (!available) return () => {};

  const delays = [
    1200, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 60000,
  ].filter(d => d <= windowMs);
  const timers = delays.map(d => setTimeout(() => { requestOtpAutofill(); }, d));

  return () => timers.forEach(clearTimeout);
};
