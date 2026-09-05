import axios from 'axios';

// Comes from .env.development (http://localhost:3000) in `npm run dev` and
// .env.production (https://beyomo.com:3099) in `npm run build`. Vite inlines it at
// build time, so changing an .env file needs a dev-server restart to take effect.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://beyomo.com:3099";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

export default api;
