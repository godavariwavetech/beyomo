import {useCallback, useRef} from 'react';
import {AppState} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

// Check only the visible screen, without overlapping requests or background polling.
export const useAutomaticRefresh = (
  refresh: (isCancelled: () => boolean) => Promise<unknown>,
  scope: string,
) => {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    let running = false;
    const check = async () => {
      if (cancelled || running || AppState.currentState === 'background' || AppState.currentState === 'inactive') return;
      running = true;
      try {
        await refreshRef.current(() => cancelled);
      } catch {
        // A transient refresh failure retains current data; checkout validates again.
      } finally {
        running = false;
      }
    };
    void check();
    const timer = setInterval(() => { void check(); }, 30000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void check();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      subscription.remove();
    };
    // Restart and cancel stale responses when the category or city changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]));
};
