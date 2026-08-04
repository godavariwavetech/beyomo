import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, CalendarCheck, Sparkles,
  DollarSign, Tag, Star, Bell, BarChart2, Settings, LogOut, X,
  ShieldCheck, MessageCircle, Building2, Globe, Package, Boxes, TrendingUp, BookOpen, Inbox, Wallet, UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../data/mockData';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard, perm: 'dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/users',     label: 'Users',           icon: Users,          perm: 'users' },
      { path: '/partners',  label: 'Partners',        icon: UserCog,        perm: 'partners' },
      { path: '/website-registrations', label: 'Website Registrations', icon: UserPlus, perm: 'partners' },
      { path: '/bookings',  label: 'Bookings',        icon: CalendarCheck,  perm: 'bookings' },
      { path: '/services',  label: 'Services',        icon: Sparkles,       perm: 'services' },
      { path: '/skills',    label: 'Skills',          icon: BookOpen,       perm: 'skills' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/earnings',  label: 'Earnings',        icon: DollarSign,     perm: 'earnings' },
      { path: '/settlements', label: 'Settlements',   icon: Wallet,         perm: 'settlements' },
      // { path: '/coupons',   label: 'Coupons',         icon: Tag,            perm: 'coupons' }, // Coupons hidden from nav for now — route/permission stay intact, just not linked.
      { path: '/packages',  label: 'Packages',        icon: Package,        perm: 'packages' },
      { path: '/combos',    label: 'Combos',          icon: Boxes,          perm: 'combos' },
      // Offers module hidden from nav for now — route/permission stay intact, just not linked.
    ],
  },
  {
    label: 'Engagement',
    items: [
      { path: '/reviews',            label: 'Reviews',            icon: Star,           perm: 'reviews' },
      { path: '/notifications',      label: 'Notifications',      icon: Bell,           perm: 'notifications' },
      { path: '/contact-inquiries',  label: 'Contact Inquiries',  icon: Inbox,          perm: 'contacts' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/reports',      label: 'Reports',      icon: BarChart2,      perm: 'reports'    },
      { path: '/analytics',    label: 'Analytics',    icon: TrendingUp,     perm: 'analytics'  },
      { path: '/feedback',     label: 'App Feedback', icon: MessageCircle,  perm: 'feedback'   },
      { path: '/settings',     label: 'Settings',     icon: Settings,       perm: 'settings' },
      { path: '/permissions',  label: 'Permissions',  icon: ShieldCheck,    perm: 'permissions' },
    ],
  },
  {
    label: 'App Content',
    items: [
      { path: '/zones',  label: 'Zones',  icon: Globe,     perm: 'zones'  },
      { path: '/cities', label: 'Cities', icon: Building2, perm: 'cities' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">B</div>
          <div className="sidebar-logo-text">
            <h2>Beyomo</h2>
            <span>Admin Console</span>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', display: 'none' }}
            className="mobile-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => hasPermission(item.perm));
            if (!visibleItems.length) return null;
            return (
              <div key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
            <div className="sidebar-avatar">{user?.avatar}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.name}</div>
              <div className="role">{ROLE_LABELS[user?.role]}</div>
            </div>
            <LogOut size={16} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }} />
          </div>
        </div>
      </aside>
    </>
  );
}
