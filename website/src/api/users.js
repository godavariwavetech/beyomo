import { get, patch, post, put, del } from './http';

export const getProfile = (token) => get('/api/v1/users/profile', token);

export const updateProfile = (data, token) => patch('/api/v1/users/profile', data, token);

export const addAddress = (data, token) => post('/api/v1/users/address', data, token);

export const updateAddress = (addressId, data, token) =>
  put(`/api/v1/users/address/${addressId}`, data, token);

export const deleteAddress = (addressId, token) => del(`/api/v1/users/address/${addressId}`, token);
