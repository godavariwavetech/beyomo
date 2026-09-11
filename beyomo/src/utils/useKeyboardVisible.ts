import {useEffect, useState} from 'react';
import {Keyboard, Platform} from 'react-native';

/**
 * True while the soft keyboard is on screen. Used to collapse chrome that would
 * otherwise sit under (or get pushed up by) the keypad — the bottom tab bar and
 * the floating cart bar.
 *
 * iOS gets the `will*` events so the chrome disappears in step with the keyboard
 * animation; Android only fires `did*`.
 */
export const useKeyboardVisible = (): boolean => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
};
