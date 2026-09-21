// Local testing backend, reached over the USB debug bridge:
//   adb reverse tcp:3000 tcp:3000
// Re-run that after replugging the phone. Android emulator: 'http://10.0.2.2:3000'.
// Cleartext http is debug-only (android/app/src/debug/AndroidManifest.xml).
//
// Picked by build type rather than by hand. This used to be two lines with one of them
// commented out, and a release built while the local line was active shipped pointing at
// the phone's own localhost — every request failed, on every device, with nothing to see
// in the app. `__DEV__` is false in release builds, so a release can only ever get the
// live URL. To test against a different local host (LAN IP, or 10.0.2.2 on the emulator)
// change LOCAL_BASE_URL; leave LIVE_BASE_URL alone.
const LOCAL_BASE_URL = 'http://localhost:3000';
//const LOCAL_BASE_URL = 'http://192.168.1.42:3000';
const LIVE_BASE_URL = 'https://beyomo.com:3099';

// Debug-only: point a debug build at the live backend to check it against real data.
// Set back to false to go back to the local backend. This cannot affect a release —
// the __DEV__ guard below means release builds use LIVE_BASE_URL either way.
//const DEV_POINT_AT_LIVE = true;//live
const DEV_POINT_AT_LIVE = false;//local

export const BASE_URL =
  __DEV__ && !DEV_POINT_AT_LIVE ? LOCAL_BASE_URL : LIVE_BASE_URL;

export const baseURL =BASE_URL;
//export const baseURL = 'http://192.168.1.42:3000';

export const endpoints = {
  // Auth (userType will be passed as 'partner')
  SEND_OTP: '/api/v1/auth/send-otp',
  VERIFY_OTP: '/api/v1/auth/verify-otp',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',

  // Partner profile & operations
  PARTNER_PROFILE: '/api/v1/partners/profile',
  PARTNER_DELETE_ACCOUNT: '/api/v1/partners/profile',
  PARTNER_DOCUMENTS: '/api/v1/partners/documents',
  PARTNER_DASHBOARD: '/api/v1/partners/dashboard',
  PARTNER_EARNINGS: '/api/v1/partners/earnings',
  PARTNER_WALLET: '/api/v1/partners/wallet',
  PARTNER_BOOKINGS: '/api/v1/partners/bookings',
  PARTNER_AVAILABLE_BOOKINGS: '/api/v1/partners/bookings/available',
  PARTNER_DEVICE_TOKEN: '/api/v1/partners/device-token',
  PARTNER_ONLINE_STATUS: '/api/v1/partners/online-status',

  // Partner booking actions
  PARTNER_BOOKING_DETAIL: (id: string) => `/api/v1/partners/bookings/${id}`,
  PARTNER_BOOKING_STATUS: (id: string) => `/api/v1/partners/bookings/${id}/status`,
  // Checks the customer's 4-digit code — must pass before PARTNER_BOOKING_STATUS
  // will accept in_progress.
  PARTNER_VERIFY_OTP: (id: string) => `/api/v1/partners/bookings/${id}/verify-otp`,
  PARTNER_BOOKING_ARRIVED: (id: string) => `/api/v1/partners/bookings/${id}/arrived`,
  PARTNER_EXTRA_SERVICES: (id: string) => `/api/v1/partners/bookings/${id}/extra-services`,
  PARTNER_ADD_PACKAGE: (id: string) => `/api/v1/partners/bookings/${id}/add-package`,
  PARTNER_REMOVE_PACKAGE: (id: string) => `/api/v1/partners/bookings/${id}/remove-package`,
  PARTNER_CLAIM_SERVICES: (id: string) => `/api/v1/partners/bookings/${id}/claim-services`,

  // Reviews
  PARTNER_REVIEWS: (partnerId: string) => `/api/v1/reviews/partner/${partnerId}`,

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',

  // Cities (public, no auth)
  CITIES: '/api/v1/cities/active',
  SERVICES: '/api/v1/services',

  // App version / force-update check (public, no auth, checked at splash)
  APP_VERSION: '/api/v1/app-version',
};
