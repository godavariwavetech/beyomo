import axios from 'axios';
import {baseURL} from '../config/config';
import {store} from '../redux/store';
import {actionLogout} from '../redux/reducers/auth';

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(
  config => {
    try {
      const state = store.getState();
      const token = state.Auth?.token;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) {}
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    // Retry GET requests once on network error (no response = connection issue)
    if (config && !config._retried && !error.response && config.method === 'get') {
      config._retried = true;
      await new Promise(r => setTimeout(r, 1500));
      return api(config);
    }
    if (error.response?.status === 401) {
      store.dispatch(actionLogout());
    }
    return Promise.reject(error);
  },
);

export default api;
