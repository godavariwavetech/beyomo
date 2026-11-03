import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, MapPin, Check, Globe, UserRound, X, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCityFilter } from '../../context/CityContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../data/mockData';

const PAGE_TITLES = {
  '/dashboard':     { title: 'Dashboard',     subtitle: 'Welcome back! Here\'s what\'s happening today.' },
  '/users':         { title: 'User Management', subtitle: 'Manage customer accounts and permissions.' },
  '/partners':      { title: 'Partner Management', subtitle: 'Manage service providers and verifications.' },
  '/bookings':      { title: 'Bookings',       subtitle: 'Track and manage all service bookings.' },
  '/services':      { title: 'Services',       subtitle: 'Manage beauty and wellness service catalog.' },
  '/earnings':      { title: 'Earnings & Payments', subtitle: 'Revenue overview and partner payouts.' },
  '/settlements':   { title: 'Settlements',     subtitle: 'Track and settle partner wallet balances for COD and online jobs.' },
  '/coupons':       { title: 'Coupons & Promos', subtitle: 'Manage discount codes and referral program.' },
  '/reviews':       { title: 'Reviews & Ratings', subtitle: 'Moderate customer and partner reviews.' },
  '/notifications': { title: 'Notifications',  subtitle: 'Send and manage push notifications.' },
  '/reports':       { title: 'Reports & Analytics', subtitle: 'Business intelligence and data insights.' },
  '/settings':      { title: 'Settings',       subtitle: 'System configuration and admin management.' },
  '/cities':        { title: 'Cities',          subtitle: 'Manage cities where your service is available.' },
};

export default function Header({ onMenuClick }) {
  const { user, logout, changePassword, showToast } = useAuth();
  const { cities, selectedCities, toggleCity, clearCities, userZones } = useCityFilter();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const cityMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const pageInfo = PAGE_TITLES[location.pathname] || { title: 'Beyomo Admin', subtitle: '' };
  const roleColor = ROLE_COLORS[user?.role] || {};

  // Close city menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (cityMenuRef.current && !cityMenuRef.current.contains(e.target)) {
        setShowCityMenu(false);
      }
    };
    if (showCityMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCityMenu]);

  // Mirrors the city menu above. Deliberately NOT a full-screen click-catching overlay:
  // that swallowed the first click anywhere on the page, so clicking a sidebar module
  // while this was open only dismissed the dropdown and never navigated - you had to
  // click the module twice. A document listener closes the menu and lets the click
  // reach whatever was actually clicked.
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openProfile = () => {
    setShowDropdown(false);
    setShowPasswordForm(false);
    setNewPassword('');
    setShowNewPassword(false);
    setShowProfile(true);
  };

  const handleChangePassword = async event => {
    event.preventDefault();
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters.', 'danger');
      return;
    }
    setIsChangingPassword(true);
    const result = await changePassword(newPassword);
    setIsChangingPassword(false);
    if (!result.success) {
      showToast(result.message, 'danger');
      return;
    }
    setNewPassword('');
    setShowNewPassword(false);
    setShowPasswordForm(false);
    showToast('Password changed successfully.');
  };

  const formatProfileDate = value => {
    if (!value) return 'Not available';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
  };

  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'A';

  const btnLabel = selectedCities.length === 0
    ? 'All Cities'
    : selectedCities.length === 1
      ? selectedCities[0].name
      : `${selectedCities.length} Cities`;

  const isFiltered = selectedCities.length > 0;

  return (
    <header className="header">
      <button className="header-menu-btn header-icon-btn" onClick={onMenuClick}>
        <Menu size={20} />
      </button>

      <div className="header-breadcrumb">
        <h1>{pageInfo.title}</h1>
        <p className="header-subtitle text-sm" style={{ color: 'var(--c-text-secondary)' }}>{pageInfo.subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Zone restriction indicator */}
        {userZones.length > 0 && (
          <div className="header-zones" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {userZones.map(z => (
              <span key={z.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 700,
                padding: '4px 10px', borderRadius: 'var(--r-full)',
                background: 'var(--c-brand-teal-bg, #e0f7f4)',
                color: 'var(--c-primary)',
                border: '1px solid var(--c-primary)',
              }}>
                <Globe size={11} /> {z.name}
              </span>
            ))}
          </div>
        )}

        {/* City multi-select */}
        {cities.length > 0 && (
          <div style={{ position: 'relative' }} ref={cityMenuRef}>
            <button
              onClick={() => setShowCityMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 'var(--r-md)',
                border: `1px solid ${isFiltered ? 'var(--c-primary, #0d9488)' : 'var(--c-border)'}`,
                background: isFiltered ? 'var(--c-brand-teal-bg, #e0f7f4)' : 'white',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--c-text-primary)',
              }}
            >
              <MapPin size={14} style={{ color: 'var(--c-primary)' }} />
              <span className="header-citylabel">{btnLabel}</span>
              {isFiltered && (
                <span style={{
                  background: 'var(--c-primary, #0d9488)', color: 'white',
                  borderRadius: '50%', width: 16, height: 16,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selectedCities.length}
                </span>
              )}
              <ChevronDown size={12} style={{ color: 'var(--c-text-muted)', transform: showCityMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {showCityMenu && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, zIndex: 60, minWidth: 220,
                background: 'white', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
              }}>
                {/* Header row */}
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--c-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--c-text-secondary)' }}>
                    Filter by City
                  </span>
                  {isFiltered && (
                    <button
                      onClick={clearCities}
                      style={{ fontSize: 11, color: 'var(--c-primary, #0d9488)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* All Cities option */}
                <div
                  onClick={clearCities}
                  style={{
                    padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: !isFiltered ? 'var(--c-border-light)' : 'white',
                    fontWeight: !isFiltered ? 700 : 400,
                  }}
                  className="btn-ghost"
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--c-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: !isFiltered ? 'var(--c-primary, #0d9488)' : 'white',
                    borderColor: !isFiltered ? 'var(--c-primary, #0d9488)' : 'var(--c-border)',
                    flexShrink: 0,
                  }}>
                    {!isFiltered && <Check size={10} color="white" strokeWidth={3} />}
                  </span>
                  All Cities
                </div>

                {/* City list */}
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {cities.map(c => {
                    const checked = selectedCities.some(s => s.id === c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => toggleCity(c)}
                        style={{
                          padding: '9px 14px', fontSize: 13, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: checked ? 'rgba(13,148,136,0.06)' : 'white',
                          opacity: c.isActive ? 1 : 0.5,
                        }}
                        className="btn-ghost"
                      >
                        <span style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          border: `1.5px solid ${checked ? 'var(--c-primary, #0d9488)' : 'var(--c-border)'}`,
                          background: checked ? 'var(--c-primary, #0d9488)' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checked && <Check size={10} color="white" strokeWidth={3} />}
                        </span>
                        <span style={{ flex: 1, fontWeight: checked ? 600 : 400 }}>{c.name}</span>
                        {c.state && <span style={{ color: 'var(--c-text-muted)', fontSize: 11 }}>{c.state}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            type="button"
            className="header-user"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-expanded={showDropdown}
            aria-haspopup="menu"
          >
            <div className="header-user-avatar">{user?.avatar || initials}</div>
            <div className="header-user-info">
              <div className="name">{user?.name}</div>
              <div className="role" style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>
                <span style={{ background: roleColor.bg, color: roleColor.text, padding: '1px 6px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700 }}>
                  {ROLE_LABELS[user?.role]}
                </span>
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--c-text-muted)' }} />
          </button>

          {showDropdown && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 60,
                background: 'white', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--c-border)', minWidth: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', marginTop: 2 }}>{user?.email}</div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={openProfile}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, color: 'var(--c-text-primary)', fontWeight: 500 }}
                  className="btn-ghost"
                >
                  <UserRound size={16} />
                  Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, color: 'var(--c-danger)', fontWeight: 500 }}
                  className="btn-ghost"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
          )}
        </div>
      </div>
      {showProfile && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setShowProfile(false);
          }}
        >
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-labelledby="admin-profile-title">
            <div className="modal-header">
              <h3 id="admin-profile-title">My Profile</h3>
              <button type="button" className="modal-close" onClick={() => setShowProfile(false)} aria-label="Close profile">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-profile">
                <div className="detail-avatar">{user?.avatar || initials}</div>
                <div className="detail-info">
                  <h3>{user?.name || 'Admin'}</h3>
                  <p>{user?.email || 'Email not available'}</p>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <h4 className="form-section-title" style={{ marginBottom: 14 }}>Login Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="label">Email Address</div>
                    <div className="value">{user?.email || 'Not available'}</div>
                  </div>
                </div>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="label">Admin ID</div>
                  <div className="value">{user?.id ?? user?._id ?? 'Not available'}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Role</div>
                  <div className="value">{ROLE_LABELS[user?.role] || user?.role || 'Not available'}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Status</div>
                  <div className="value">{user?.status || 'Not available'}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Last Login</div>
                  <div className="value">{formatProfileDate(user?.lastLogin)}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="label">Account Created</div>
                  <div className="value">{formatProfileDate(user?.createdAt)}</div>
                </div>
              </div>
              <div style={{ marginTop: 24, borderTop: '1px solid var(--c-border)', paddingTop: 18 }}>
                {!showPasswordForm ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    <LockKeyhole size={16} />
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword}>
                    <h4 className="form-section-title" style={{ marginBottom: 14 }}>Change Password</h4>
                    <div className="form-grid">
                      <label className="form-group">
                        <span className="form-label">New Password</span>
                        <div style={{ position: 'relative' }}>
                          <input
                            className="form-input"
                            style={{ paddingRight: 44 }}
                            type={showNewPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            minLength={8}
                            required
                            value={newPassword}
                            onChange={event => setNewPassword(event.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-ghost"
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 6 }}
                            onClick={() => setShowNewPassword(visible => !visible)}
                            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setNewPassword('');
                          setShowNewPassword(false);
                        }}
                        disabled={isChangingPassword}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-secondary" disabled={isChangingPassword}>
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
