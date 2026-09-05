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

  const hasPermission = useCallback(
    page => {
      if (!user) return false;
      if (user.role === 'super_admin') return true;
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
