// Android emulator: 10.0.2.2 | iOS simulator: localhost | Physical device: your machine IP
export const BASE_URL = 'https://beyomo.in:3090';

export const baseURL = BASE_URL;

export const endpoints = {
  // Auth (userType will be passed as 'partner')
  SEND_OTP: '/api/v1/auth/send-otp',
  VERIFY_OTP: '/api/v1/auth/verify-otp',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',

  // Partner profile & operations
  PARTNER_PROFILE: '/api/v1/partners/profile',
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
  PARTNER_CLAIM_SERVICES: (id: string) => `/api/v1/partners/bookings/${id}/claim-services`,
  PARTNER_PROPOSE_CHANGES: (id: string) => `/api/v1/partners/bookings/${id}/propose-changes`,

  // Reviews
  PARTNER_REVIEWS: (partnerId: string) => `/api/v1/reviews/partner/${partnerId}`,

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',

  // Cities (public, no auth)
  CITIES: '/api/v1/cities/active',
  SERVICES: '/api/v1/services',
};
