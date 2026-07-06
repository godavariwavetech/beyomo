import { API_BASE_URL } from '../config';

async function request(path, { method = 'GET', body, token, headers } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

export const get = (path, token) => request(path, { method: 'GET', token });
export const post = (path, body, token) => request(path, { method: 'POST', body, token });
export const put = (path, body, token) => request(path, { method: 'PUT', body, token });
export const patch = (path, body, token) => request(path, { method: 'PATCH', body, token });
export const del = (path, token) => request(path, { method: 'DELETE', token });
