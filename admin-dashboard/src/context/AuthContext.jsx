import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import api from '../services/api';
import {ROLE_PERMISSIONS} from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/api/v1/admin/auth/login', {email, password});
      const {token, admin} = response.data.data;
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      setUser(admin);
      return {success: true};
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.message ?? 'Invalid email or password.';
      return {success: false, message};
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/v1/admin/auth/logout');
    } catch (_) {}
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
  }, []);

  // Permissions may change in Super Admin's window while staff stay logged in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let refreshing = false;
    const refreshPermissions = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token || refreshing) return;
      refreshing = true;
      try {
        const response = await api.get('/api/v1/admin/auth/me');
        if (cancelled || localStorage.getItem('adminToken') !== token) return;
        const current = response.data?.data;
        if (!current) return;
        const stored = localStorage.getItem('adminUser');
        const updated = { ...JSON.parse(stored || '{}'), ...current };
        const serialized = JSON.stringify(updated);
        if (serialized !== stored) {
          localStorage.setItem('adminUser', serialized);
          setUser(updated);
        }
      } catch (_) {
        // Keep the session usable during a temporary connection failure.
      } finally {
        refreshing = false;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshPermissions();
    };
    refreshPermissions();
    const timer = setInterval(onVisible, 30000);
    window.addEventListener('focus', refreshPermissions);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', refreshPermissions);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, user?._id]);

  const hasPermission = useCallback(
    page => {
      if (!user) return false;
      if (user.role === 'super_admin') return true;
      if (page === 'bookings_create') {
        return !!user.customPermissions?.includes('bookings')
          && !!user.customPermissions?.includes('bookings_create');
      }
      if (user.customPermissions?.length) return user.customPermissions.includes(page);
      return ROLE_PERMISSIONS[user.role]?.includes(page) ?? false;
    },
    [user],
  );

  return (
    <AuthContext.Provider value={{user, login, logout, hasPermission, showToast}}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
