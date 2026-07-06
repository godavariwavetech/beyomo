import { get, post } from './http';

export const createBooking = (payload, token) => post('/api/v1/bookings', payload, token);

export const getBookingById = (id, token) => get(`/api/v1/bookings/${id}`, token);
