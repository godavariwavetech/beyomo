// Android emulator: 10.0.2.2 | iOS simulator: localhost | Physical device: your machine IP
export const BASE_URL = 'https://beyomo.in:3090';

export const baseURL = BASE_URL;

export const endpoints = {
  // Auth
  SEND_OTP: '/api/v1/auth/send-otp',
  VERIFY_OTP: '/api/v1/auth/verify-otp',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',

  // User profile & addresses
  USER_PROFILE: '/api/v1/users/profile',
  USER_ADDRESS: '/api/v1/users/address',
  USER_DEVICE_TOKEN: '/api/v1/users/device-token',
  USER_BOOKINGS: '/api/v1/users/bookings',
  USER_WALLET: '/api/v1/users/wallet',

  // Services
  CATEGORIES: '/api/v1/services/categories',
  NEARBY_PARTNERS: '/api/v1/services/nearby',
  SERVICES: '/api/v1/services',

  // Bookings
  BOOKINGS: '/api/v1/bookings',
  USER_ADD_SERVICES: (id: string) => `/api/v1/bookings/${id}/add-services`,

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',

  // Payments
  PAYMENT_CREATE_ORDER: '/api/v1/payments/create-order',
  PAYMENT_VERIFY: '/api/v1/payments/verify',
  PAYMENT_HISTORY: '/api/v1/payments/history',

  // Coupons
  COUPONS: '/api/v1/coupons',
  COUPON_VALIDATE: '/api/v1/coupons/validate',
  COUPON_APPLY: '/api/v1/coupons/apply',

  // Offers
  OFFERS: '/api/v1/offers',
  OFFERS_CHECK: '/api/v1/offers/check',

  // Packages
  PACKAGES: '/api/v1/packages',

  // Referral
  REFERRAL: '/api/v1/users/referral',

  // Reviews (user's own reviews)
  USER_REVIEWS: '/api/v1/users/reviews',

  // Banners & Zones (public, no auth)
  BANNERS: '/api/v1/banners',
  ZONE_CHECK: '/api/v1/zones/check',

  // Cities (public, no auth)
  CITIES: '/api/v1/cities/active',

  // Global search (public, no auth)
  SEARCH: '/api/v1/search',

  // App version / force-update check (public, no auth, checked at splash)
  APP_VERSION: '/api/v1/app-version',
};
