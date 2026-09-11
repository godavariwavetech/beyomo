import axios from 'axios';
import {baseURL} from '../config/config';
import {store} from '../redux/store';
import {actionLogout} from '../redux/reducers/auth';
import {resetToLogin} from '../navigation/navigationRef';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  config => {
    try {
      const state = store.getState();
      const token = state.Auth?.token;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error attaching auth token:', error);
    }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Session expired or revoked server-side. Clearing state alone left the partner
      // on a signed-in screen showing stale data, so send them to Login as well.
      store.dispatch(actionLogout());
      resetToLogin();
    }
    return Promise.reject(error);
  },
);

export default api;
