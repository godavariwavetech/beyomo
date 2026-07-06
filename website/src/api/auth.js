import { post } from './http';

export const sendOtp = (phone) => post('/api/v1/auth/send-otp', { phone, userType: 'user' });

export const verifyOtp = (phone, otp) => post('/api/v1/auth/verify-otp', { phone, otp, userType: 'user' });
