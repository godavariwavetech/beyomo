import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useNotifications } from './hooks/useNotifications';
import { CityProvider } from './context/CityContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Partners from './pages/Partners';
import WebsiteRegistrations from './pages/WebsiteRegistrations';
import Bookings from './pages/Bookings';
import Services from './pages/Services';
import Earnings from './pages/Earnings';
import Settlements from './pages/Settlements';
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Permissions from './pages/Permissions';
import Feedback from './pages/Feedback';
import Zones from './pages/Zones';
import Cities from './pages/Cities';
import Offers from './pages/Offers';
import Packages from './pages/Packages';
import Combos from './pages/Combos';
import Analytics from './pages/Analytics';
import Skills from './pages/Skills';
import ContactInquiries from './pages/ContactInquiries';

function AccessDenied() {
  return (
    <div className="access-denied">
      <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <h2>Access Denied</h2>
      <p>You don't have permission to view this page. Contact your administrator to request access.</p>
    </div>
  );
}

function PermissionGuard({ page, children }) {
  const { hasPermission } = useAuth();
  return hasPermission(page) ? children : <AccessDenied />;
}

function ProtectedRoutes() {
  const { user } = useAuth();
  useNotifications(user);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<PermissionGuard page="dashboard"><Dashboard /></PermissionGuard>} />
        <Route path="users"         element={<PermissionGuard page="users"><Users /></PermissionGuard>} />
        <Route path="partners"      element={<PermissionGuard page="partners"><Partners /></PermissionGuard>} />
        <Route path="website-registrations" element={<PermissionGuard page="partners"><WebsiteRegistrations /></PermissionGuard>} />
        <Route path="bookings"      element={<PermissionGuard page="bookings"><Bookings /></PermissionGuard>} />
        <Route path="services"      element={<PermissionGuard page="services"><Services /></PermissionGuard>} />
        <Route path="earnings"      element={<PermissionGuard page="earnings"><Earnings /></PermissionGuard>} />
        <Route path="settlements"   element={<PermissionGuard page="settlements"><Settlements /></PermissionGuard>} />
        <Route path="coupons"       element={<PermissionGuard page="coupons"><Coupons /></PermissionGuard>} />
        <Route path="reviews"       element={<PermissionGuard page="reviews"><Reviews /></PermissionGuard>} />
        <Route path="notifications" element={<PermissionGuard page="notifications"><Notifications /></PermissionGuard>} />
        <Route path="reports"       element={<PermissionGuard page="reports"><Reports /></PermissionGuard>} />
        <Route path="settings"      element={<PermissionGuard page="settings"><Settings /></PermissionGuard>} />
        <Route path="permissions"   element={<PermissionGuard page="permissions"><Permissions /></PermissionGuard>} />
        <Route path="feedback"      element={<PermissionGuard page="feedback"><Feedback /></PermissionGuard>} />
        <Route path="zones"         element={<PermissionGuard page="zones"><Zones /></PermissionGuard>} />
        <Route path="cities"        element={<PermissionGuard page="cities"><Cities /></PermissionGuard>} />
        <Route path="offers"        element={<PermissionGuard page="offers"><Offers /></PermissionGuard>} />
        <Route path="packages"      element={<PermissionGuard page="packages"><Packages /></PermissionGuard>} />
        <Route path="combos"        element={<PermissionGuard page="combos"><Combos /></PermissionGuard>} />
        <Route path="analytics"     element={<PermissionGuard page="analytics"><Analytics /></PermissionGuard>} />
        <Route path="skills"             element={<PermissionGuard page="skills"><Skills /></PermissionGuard>} />
        <Route path="contact-inquiries" element={<PermissionGuard page="contacts"><ContactInquiries /></PermissionGuard>} />
        <Route path="*"             element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
