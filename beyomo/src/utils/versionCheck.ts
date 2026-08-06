import {Platform} from 'react-native';
import {BASE_URL, endpoints} from '../config/config';

// Bump this at every release to match android/app/build.gradle's versionName
// (and the matching iOS build version) — this is what gets compared against the
// admin-configured minimum version at splash.
export const CURRENT_APP_VERSION = '1.0.2';

// Simple dot-separated numeric version compare (e.g. "1.0.2" vs "1.1") — good
// enough for our versioning scheme, no need for a semver dependency.
export const isVersionBelow = (current: string, min: string): boolean => {
  const c = current.split('.').map(n => parseInt(n, 10) || 0);
  const m = min.split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(c.length, m.length);
  for (let i = 0; i < len; i++) {
    const cv = c[i] ?? 0;
    const mv = m[i] ?? 0;
    if (cv < mv) return true;
    if (cv > mv) return false;
  }
  return false;
};

export type ForceUpdateResult =
  | {blocked: true; updateUrl: string | null; message: string | null}
  | {blocked: false};

export const checkForceUpdate = async (app: 'user' | 'partner'): Promise<ForceUpdateResult> => {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const resp = await fetch(`${BASE_URL}${endpoints.APP_VERSION}?app=${app}&platform=${platform}`);
    const json = await resp.json();
    const cfg = json?.data;
    if (cfg?.minVersion && isVersionBelow(CURRENT_APP_VERSION, cfg.minVersion)) {
      return {blocked: true, updateUrl: cfg.updateUrl ?? null, message: cfg.message ?? null};
    }
  } catch {
    // Check failed (offline, backend hiccup) — fail open rather than lock
    // everyone out of the app over a network blip.
  }
  return {blocked: false};
};
