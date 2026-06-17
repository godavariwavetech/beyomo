import {BASE_URL} from '../config/config';

/** Converts a relative /uploads/... path to a full URL. Pass-through for http(s) URLs. */
export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};
