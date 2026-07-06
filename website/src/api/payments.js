import { post } from './http';

export const createPaymentOrder = (bookingId, token) =>
  post('/api/v1/payments/create-order', { bookingId }, token);

export const verifyPayment = (payload, token) => post('/api/v1/payments/verify', payload, token);
