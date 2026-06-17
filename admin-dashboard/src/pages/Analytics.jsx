import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag, Users, TrendingUp, Award, Search, Download,
  ChevronLeft, ChevronRight, RefreshCw,
  ShoppingBag, Percent, UserCheck, Crown, Star, Phone, Mail
} from 'lucide-react';
import api from '../services/api';
import { useCityFilter } from '../context/CityContext';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmtRs   = v => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const exportCSV = (rows, cols, filename) => {
  const headers = cols.map(c => c.label);
  const lines   = rows.map(r => cols.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv     = [headers.join(','), ...lines].join('\n');
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
};

const STATUS_CHIP = {
  completed:   { label: 'Completed',   bg: '#d1fae5', color: '#065f46' },
  cancelled:   { label: 'Cancelled',   bg: '#fee2e2', color: '#991b1b' },
  pending:     { label: 'Pending',     bg: '#fef3c7', color: '#92400e' },
  confirmed:   { label: 'Confirmed',   bg: '#dbeafe', color: '#1e40af' },
  in_progress: { label: 'In Progress', bg: '#ede9fe', color: '#5b21b6' },
};

function StatusChip({ status }) {
  const s = STATUS_CHIP[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

const LOYALTY = [
  { min: 10, label: 'Gold',   color: '#b45309', bg: '#fef3c7', Icon: Crown    },
  { min: 5,  label: 'Silver', color: '#4b5563', bg: '#f3f4f6', Icon: Star     },
  { min: 2,  label: 'Bronze', color: '#92400e', bg: '#fde68a', Icon: Award    },
  { min: 0,  label: 'New',    color: '#2563eb', bg: '#dbeafe', Icon: UserCheck },
];

function LoyaltyBadge({ count }) {
  const tier = LOYALTY.find(l => count >= l.min) || LOYALTY[LOYALTY.length - 1];
  const { Icon } = tier;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20, background: tier.bg, color: tier.color }}>
      <Icon size={11} />{tier.label}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: 160 }}>
      <div className="stat-card-icon" style={{ background: color + '18', color }}>
        <Icon size={20} />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="btn btn-outline" style={{ padding: '4px 10px' }}
        disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>
        Page {page} / {totalPages}
      </span>
      <button className="btn btn-outline" style={{ padding: '4px 10px' }}
        disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Coupon Usage Tab ──────────────────────────────────────────────────────────
function CouponUsageTab() {
  const { cityParam } = useCityFilter();
  const [rows,       setRows]       = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [inputVal,   setInputVal]   = useState('');

  const load = useCallback((page = 1, q = '') => {
    setLoading(true);
    const params = { page, limit: 20, ...(q ? { search: q } : {}), ...(cityParam ? { cityIds: cityParam } : {}) };
    api.get('/api/v1/admin/reports/coupon-usage', { params })
      .then(res => {
        const d = res.data;
        setRows(d.data ?? []);
        setSummary(d.summary ?? null);
        setPagination({
          page:       d.pagination?.page       ?? 1,
          totalPages: d.pagination?.totalPages ?? 1,
          total:      d.pagination?.total      ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityParam]);

  useEffect(() => { load(1, ''); }, [load]);

  const handleSearch = e => {
    e.preventDefault();
    setSearch(inputVal);
    load(1, inputVal);
  };

  const handleClear = () => {
    setInputVal('');
    setSearch('');
    load(1, '');
  };

  const flatRows = rows.map(r => ({
    ...r,
    userName:  r.user?.name  || 'N/A',
    userPhone: r.user?.phone || '—',
  }));

  const csvCols = [
    { key: 'bookingCode',    label: 'Booking Code'  },
    { key: 'couponCode',     label: 'Coupon Code'   },
    { key: 'userName',       label: 'User'          },
    { key: 'userPhone',      label: 'Phone'         },
    { key: 'orderAmount',    label: 'Order Amount'  },
    { key: 'discountAmount', label: 'Discount'      },
    { key: 'totalAmount',    label: 'Final Amount'  },
    { key: 'status',         label: 'Status'        },
    { key: 'usedAt',         label: 'Date'          },
  ];

  return (
    <div>
      {summary && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <SummaryCard icon={ShoppingBag} label="Total Coupon Orders"  value={summary.totalOrders.toLocaleString()}  color="#7c3aed" />
          <SummaryCard icon={Percent}     label="Total Discount Given"  value={fmtRs(summary.totalDiscount)}           color="#dc2626" />
          <SummaryCard icon={Users}       label="Unique Users"          value={summary.uniqueUsers.toLocaleString()}   color="#0369a1" />
          <SummaryCard icon={Tag}         label="Most Used Coupon"
            value={summary.mostUsedCoupon?.code || '—'}
            sub={summary.mostUsedCoupon ? `Used ${summary.mostUsedCoupon.count} times` : null}
            color="#059669" />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search size={14} />
            <input placeholder="Search coupon code…" value={inputVal}
              onChange={e => setInputVal(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px' }}>Search</button>
          {search && (
            <button type="button" className="btn btn-outline" style={{ padding: '6px 12px' }}
              onClick={handleClear}>Clear</button>
          )}
        </form>
        <button className="btn btn-outline" onClick={() => load(pagination.page, search)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
        <button className="btn btn-outline" onClick={() => exportCSV(flatRows, csvCols, 'coupon-usage.csv')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Coupon Code</th>
              <th>User</th>
              <th>Phone</th>
              <th style={{ textAlign: 'right' }}>Order Amount</th>
              <th style={{ textAlign: 'right' }}>Discount</th>
              <th style={{ textAlign: 'right' }}>Final Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>Loading…</td></tr>
            ) : flatRows.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>No coupon orders found</td></tr>
            ) : flatRows.map(row => (
              <tr key={row.bookingId}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--c-primary)' }}>
                    {row.bookingCode || `#${row.bookingId}`}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                    background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 6 }}>
                    {row.couponCode}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{row.userName}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--c-text-secondary)' }}>
                  {row.userPhone}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmtRs(row.orderAmount)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#dc2626', fontWeight: 700 }}>
                  -{fmtRs(row.discountAmount)}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmtRs(row.totalAmount)}</td>
                <td><StatusChip status={row.status} /></td>
                <td style={{ fontSize: 12, color: 'var(--c-text-secondary)', whiteSpace: 'nowrap' }}>
                  {fmtTime(row.usedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
          {pagination.total} order{pagination.total !== 1 ? 's' : ''} with coupons
        </span>
        <Pagination page={pagination.page} totalPages={pagination.totalPages}
          onPage={p => load(p, search)} />
      </div>
    </div>
  );
}

// ── User Engagement Tab ───────────────────────────────────────────────────────
function UserEngagementTab() {
  const { cityParam } = useCityFilter();
  const [rows,       setRows]       = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(false);

  const load = useCallback((page = 1) => {
    setLoading(true);
    const params = { page, limit: 20, ...(cityParam ? { cityIds: cityParam } : {}) };
    api.get('/api/v1/admin/reports/user-engagement', { params })
      .then(res => {
        const d = res.data;
        setRows(d.data ?? []);
        setSummary(d.summary ?? null);
        setPagination({
          page:       d.pagination?.page       ?? 1,
          totalPages: d.pagination?.totalPages ?? 1,
          total:      d.pagination?.total      ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityParam]);

  useEffect(() => { load(1); }, [load]);

  const csvCols = [
    { key: 'name',              label: 'Name'             },
    { key: 'phone',             label: 'Phone'            },
    { key: 'email',             label: 'Email'            },
    { key: 'totalBookings',     label: 'Total Bookings'   },
    { key: 'completedBookings', label: 'Completed'        },
    { key: 'cancelledBookings', label: 'Cancelled'        },
    { key: 'couponUsageCount',  label: 'Coupon Uses'      },
    { key: 'totalSpent',        label: 'Total Spent (Rs)' },
    { key: 'lastBookingAt',     label: 'Last Booking'     },
    { key: 'joinedAt',          label: 'Joined'           },
  ];

  return (
    <div>
      {summary && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <SummaryCard icon={Users}      label="Total Users"          value={summary.totalUsers.toLocaleString()}  color="#0369a1" />
          <SummaryCard icon={UserCheck}  label="Active Users"         value={summary.activeUsers.toLocaleString()} color="#059669"
            sub="At least 1 booking" />
          <SummaryCard icon={Crown}      label="Power Users"          value={summary.powerUsers.toLocaleString()}  color="#b45309"
            sub="5+ bookings" />
          <SummaryCard icon={TrendingUp} label="Avg Bookings / User"  value={summary.avgBookings.toFixed(1)}        color="#7c3aed" />
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 600 }}>Loyalty tiers:</span>
        {LOYALTY.map(({ min, label, color, bg, Icon }) => {
          const range = min === 10 ? '(10+)' : min === 5 ? '(5–9)' : min === 2 ? '(2–4)' : '(new)';
          return (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
              fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: bg, color }}>
              <Icon size={11} />{label} {range}
            </span>
          );
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => load(pagination.page)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-outline" onClick={() => exportCSV(rows, csvCols, 'user-engagement.csv')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th style={{ textAlign: 'center' }}>Bookings</th>
              <th style={{ textAlign: 'center' }}>Completed</th>
              <th style={{ textAlign: 'center' }}>Coupons Used</th>
              <th style={{ textAlign: 'right' }}>Total Spent</th>
              <th>Last Active</th>
              <th>Joined</th>
              <th>Loyalty</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)' }}>No users found</td></tr>
            ) : rows.map(row => (
              <tr key={row.userId}>
                <td>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  {row.email && (
                    <div style={{ fontSize: 11, color: 'var(--c-text-muted)', display: 'flex',
                      alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <Mail size={10} />{row.email}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'monospace' }}>
                    <Phone size={11} style={{ color: 'var(--c-text-muted)' }} />{row.phone}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15,
                    color: row.totalBookings > 0 ? 'var(--c-primary)' : 'var(--c-text-muted)' }}>
                    {row.totalBookings}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>{row.completedBookings}</span>
                  {row.cancelledBookings > 0 && (
                    <span style={{ fontSize: 11, color: '#dc2626', marginLeft: 4 }}>({row.cancelledBookings} ✗)</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {row.couponUsageCount > 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700,
                      color: '#5b21b6', background: '#ede9fe', padding: '2px 8px', borderRadius: 12 }}>
                      <Tag size={10} />{row.couponUsageCount}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--c-text-muted)', fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700,
                  color: row.totalSpent > 0 ? 'var(--c-text)' : 'var(--c-text-muted)' }}>
                  {row.totalSpent > 0 ? fmtRs(row.totalSpent) : '—'}
                </td>
                <td style={{ fontSize: 12, color: 'var(--c-text-secondary)', whiteSpace: 'nowrap' }}>
                  {row.lastBookingAt
                    ? fmtDate(row.lastBookingAt)
                    : <span style={{ color: 'var(--c-text-muted)' }}>No bookings</span>}
                </td>
                <td style={{ fontSize: 12, color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>
                  {fmtDate(row.joinedAt)}
                </td>
                <td><LoyaltyBadge count={row.totalBookings} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
          {pagination.total} user{pagination.total !== 1 ? 's' : ''}
        </span>
        <Pagination page={pagination.page} totalPages={pagination.totalPages} onPage={p => load(p)} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'coupons',    label: 'Coupon Usage',    Icon: Tag        },
  { key: 'engagement', label: 'User Engagement', Icon: TrendingUp },
];

export default function Analytics() {
  const [activeTab, setTab] = useState('coupons');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Coupon usage history and user engagement insights</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--c-border)', marginBottom: 24 }}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button key={key} onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 14, fontWeight: active ? 700 : 500,
                color: active ? 'var(--c-primary)' : 'var(--c-text-secondary)',
                borderBottom: active ? '2px solid var(--c-primary)' : '2px solid transparent',
                marginBottom: -2, transition: 'all .15s',
              }}>
              <Icon size={15} />{label}
            </button>
          );
        })}
      </div>

      {activeTab === 'coupons'    && <CouponUsageTab />}
      {activeTab === 'engagement' && <UserEngagementTab />}
    </div>
  );
}
