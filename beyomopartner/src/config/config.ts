// Android emulator: 10.0.2.2 | iOS simulator: localhost | Physical device: your machine IP
export const BASE_URL = 'https://beyomo.com:3099';
// export const BASE_URL = 'http://192.168.1.16:3000';

export const baseURL = BASE_URL;

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

  // Partner booking actions
  PARTNER_BOOKING_DETAIL: (id: string) => `/api/v1/partners/bookings/${id}`,
  PARTNER_BOOKING_STATUS: (id: string) => `/api/v1/partners/bookings/${id}/status`,
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
