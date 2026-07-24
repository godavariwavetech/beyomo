import {useEffect, useRef} from 'react';

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Silently re-runs `callback` every `intervalMs` while the component stays mounted,
 * so a page's data stays fresh without the admin needing to navigate away and back.
 * Always calls the latest `callback` (via ref) so callers don't need to memoize it.
 */
export function useAutoRefresh(callback, intervalMs = FIVE_MINUTES) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
