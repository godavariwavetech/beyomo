import {BASE_URL} from '../config/config';

/** Converts a relative /uploads/... path to a full URL. Pass-through for http(s) URLs. */
export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};

/**
 * Formats a money value for display: rounded to the nearest rupee (no paise)
 * and grouped in the Indian numbering system. e.g. 1234.56 -> "1,235".
 */
export const formatAmount = (n: any): string =>
  Math.round(Number(n) || 0).toLocaleString('en-IN', {maximumFractionDigits: 0});
