import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, MapPin, Check, Globe } from 'lucide-react';
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
  const { user, logout } = useAuth();
  const { cities, selectedCities, toggleCity, clearCities, userZones } = useCityFilter();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const cityMenuRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

        <button className="header-icon-btn">
          <Bell size={18} />
          <span className="notif-dot" />
        </button>

        <div style={{ position: 'relative' }}>
          <div className="header-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="header-user-avatar">{user?.avatar}</div>
            <div className="header-user-info">
              <div className="name">{user?.name}</div>
              <div className="role" style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>
                <span style={{ background: roleColor.bg, color: roleColor.text, padding: '1px 6px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700 }}>
                  {ROLE_LABELS[user?.role]}
                </span>
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--c-text-muted)' }} />
          </div>

          {showDropdown && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 59 }} onClick={() => setShowDropdown(false)} />
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
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, color: 'var(--c-danger)', fontWeight: 500 }}
                  className="btn-ghost"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
