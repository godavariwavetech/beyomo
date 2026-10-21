import {BASE_URL} from '../config/config';

export const formatBookingCreatedAt = (value?: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })} IST`;
};

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
