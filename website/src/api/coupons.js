import { post } from './http';

export const applyCoupon = (code, orderAmount, token) =>
  post('/api/v1/coupons/apply', { code, orderAmount }, token);
