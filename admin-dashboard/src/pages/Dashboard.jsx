import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, UserCog, CalendarCheck, DollarSign, Zap, Star, Tag, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { useReports } from '../hooks/useReports';
import { useCityFilter } from '../context/CityContext';

const fmtCurrency = (v) => v >= 100000 ? `₹${(v/100000).toFixed(2)}L` : `₹${v.toLocaleString('en-IN')}`;
const fmtNum = (v) => typeof v === 'number' && v % 1 !== 0 ? v.toFixed(1) : v?.toLocaleString('en-IN');

function StatCard({ icon: Icon, label, value, change, changeType, extra, gradient }) {
  const Up = changeType === 'up';
  return (
    <div className="stat-card" style={gradient ? { background: gradient, border: 'none' } : {}}>
      <div className="stat-card-header">
        <div>
          <div className="stat-label" style={gradient ? { color: 'rgba(255,255,255,0.8)' } : {}}>{label}</div>
          <div className="stat-value" style={gradient ? { color: 'white' } : {}}>{value}</div>
        </div>
        <div className="stat-icon" style={gradient ? { background: 'rgba(255,255,255,0.2)' } : { background: 'var(--c-border-light)' }}>
          <Icon size={22} style={gradient ? { color: 'white' } : { color: 'var(--c-brand-primary)' }} />
        </div>
      </div>
      <div className="stat-change" style={gradient ? { color: 'rgba(255,255,255,0.8)' } : {}}>
        {Up ? <TrendingUp size={14} style={{ color: gradient ? 'rgba(255,255,255,0.9)' : 'var(--c-success)' }} />
             : <TrendingDown size={14} style={{ color: gradient ? 'rgba(255,255,255,0.9)' : 'var(--c-danger)' }} />}
        <span style={{ color: gradient ? 'rgba(255,255,255,0.9)' : (Up ? 'var(--c-success)' : 'var(--c-danger)'), fontWeight: 600 }}>
          {Up ? '+' : ''}{change}{typeof change === 'number' && Math.abs(change) < 20 && label !== 'Avg. Rating' ? '%' : ''}
        </span>
        <span style={{ fontSize: 12 }}>{extra}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', padding: '12px 16px', boxShadow: 'var(--shadow-lg)' }}>
      <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--c-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {p.name.toLowerCase().includes('revenue') || p.name.toLowerCase().includes('commission') || p.name.toLowerCase().includes('payout')
              ? fmtCurrency(p.value) : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { action } = useReports();
  const { cityParam } = useCityFilter();
  const emptyStats = {
    totalUsers:     { value: 0, change: 0, changeType: 'up', extra: 'new this month' },
    totalPartners:  { value: 0, change: 0, changeType: 'up', extra: 'pending verify' },
    todayBookings:  { value: 0, change: 0, changeType: 'up', extra: 'this month' },
    monthlyRevenue: { value: 0, change: 0, changeType: 'up', extra: 'vs last month' },
    activeJobs:     { value: 0, change: 0, changeType: 'up', extra: 'in queue' },
    pendingReviews: { value: 0, change: 0, changeType: 'up', extra: 'awaiting moderation' },
    activeCoupons:  { value: 0, change: 0, changeType: 'up', extra: 'live now' },
    avgRating:      { value: 0, change: 0, changeType: 'up', extra: 'from reviews' },
  };
  const [stats, setStats]               = useState(emptyStats);
  const [revenueData, setRevenueData]   = useState([]);
  const [bookingStatusData, setBSD]     = useState([]);
  const [userGrowthData, setUGD]        = useState([]);
  const [recentBookings, setRB]         = useState([]);
  const [onlinePartners, setOP]         = useState([]);
  const [topServices, setTS]            = useState([]);

  useEffect(() => {
    const qp = cityParam ? `?cityIds=${cityParam}` : '';
    action('get', `/api/v1/admin/reports/dashboard${qp}`).then(res => {
      if (!res.ok || !res.data?.data) return;
      const d = res.data.data;
      setStats({
        totalUsers:     { value: d.users?.total ?? 0,          change: d.users?.newThisMonth ?? 0,   changeType: 'up',                                              extra: 'new this month' },
        totalPartners:  { value: d.partners?.total ?? 0,       change: d.partners?.pending ?? 0,     changeType: 'up',                                              extra: 'pending verify' },
        todayBookings:  { value: d.bookings?.today ?? 0,       change: d.bookings?.thisMonth ?? 0,   changeType: 'up',                                              extra: 'this month total' },
        monthlyRevenue: { value: d.revenue?.thisMonth ?? 0,    change: d.revenue?.growth ?? 0,       changeType: (d.revenue?.growth ?? 0) >= 0 ? 'up' : 'down',     extra: 'vs last month' },
        activeJobs:     { value: d.bookings?.pending ?? 0,     change: 0,                            changeType: 'up',                                              extra: 'pending bookings' },
        pendingReviews: { value: 0,                            change: 0,                            changeType: 'up',                                              extra: 'awaiting moderation' },
        activeCoupons:  { value: 0,                            change: 0,                            changeType: 'up',                                              extra: 'live now' },
        avgRating:      { value: d.avgRating ?? 0,             change: 0,                            changeType: 'up',                                              extra: 'from reviews' },
      });
    });
    action('get', `/api/v1/admin/reports/revenue${cityParam ? `?cityIds=${cityParam}` : ''}`).then(res => {
      const arr = res.data?.data?.data;
      if (res.ok && Array.isArray(arr)) setRevenueData(arr);
    });
    action('get', `/api/v1/admin/bookings?limit=6${cityParam ? `&cityIds=${cityParam}` : ''}`).then(res => {
      if (res.ok && Array.isArray(res.data?.data)) setRB(res.data.data);
    });
    action('get', `/api/v1/admin/partners?limit=5${cityParam ? `&cityIds=${cityParam}` : ''}`).then(res => {
      if (res.ok && Array.isArray(res.data?.data)) setOP(res.data.data);
    });
    action('get', '/api/v1/admin/services?limit=7').then(res => {
      if (res.ok && Array.isArray(res.data?.data)) setTS(res.data.data);
    });
  }, [cityParam]);

  const s = stats;

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard icon={Users}        label="Total Users"      value={fmtNum(s.totalUsers.value)}     change={s.totalUsers.change}     changeType={s.totalUsers.changeType}     extra={s.totalUsers.extra}     gradient="linear-gradient(135deg, #064081, #0284c7)" />
        <StatCard icon={UserCog}      label="Total Partners"   value={fmtNum(s.totalPartners.value)}   change={s.totalPartners.change}   changeType={s.totalPartners.changeType}   extra={s.totalPartners.extra}   gradient="linear-gradient(135deg, #0E5843, #16a34a)" />
        <StatCard icon={CalendarCheck}label="Today's Bookings" value={fmtNum(s.todayBookings.value)}   change={s.todayBookings.change}   changeType={s.todayBookings.changeType}   extra={s.todayBookings.extra}   gradient="linear-gradient(135deg, #FF9500, #f97316)" />
        <StatCard icon={DollarSign}   label="Monthly Revenue"  value={fmtCurrency(s.monthlyRevenue.value)} change={s.monthlyRevenue.change} changeType={s.monthlyRevenue.changeType} extra={s.monthlyRevenue.extra} gradient="linear-gradient(135deg, #02B0E8, #0891b2)" />
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: -8 }}>
        <StatCard icon={Zap}    label="Active Jobs Now"  value={fmtNum(s.activeJobs.value)}    change={s.activeJobs.change}    changeType={s.activeJobs.changeType}    extra={s.activeJobs.extra} />
        <StatCard icon={Star}   label="Pending Reviews"  value={fmtNum(s.pendingReviews.value)} change={s.pendingReviews.change} changeType={s.pendingReviews.changeType} extra={s.pendingReviews.extra} />
        <StatCard icon={Tag}    label="Active Coupons"   value={fmtNum(s.activeCoupons.value)}  change={s.activeCoupons.change}  changeType={s.activeCoupons.changeType}  extra={s.activeCoupons.extra} />
        <StatCard icon={TrendingUp} label="Avg. Rating"  value={fmtNum(s.avgRating.value)}     change={s.avgRating.change}     changeType={s.avgRating.changeType}     extra={s.avgRating.extra} />
      </div>

      {/* Revenue + Booking Status */}
      <div className="charts-grid charts-grid-2 mb-24" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue Overview</div>
              <div className="card-subtitle">Last 12 months · total vs commission vs payout</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="revenue"    name="Revenue"    fill="#064081" radius={[3,3,0,0]} />
                <Bar dataKey="commission" name="Commission" fill="#02B0E8" radius={[3,3,0,0]} />
                <Bar dataKey="payout"     name="Payout"     fill="#FDD77A" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Booking Status</div>
            <div className="card-subtitle">All-time distribution</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {bookingStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 4 }}>
              {bookingStatusData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--c-text-secondary)' }}>{d.name}</span>
                  <span style={{ fontWeight: 700 }}>{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Services + User Growth */}
      <div className="charts-grid charts-grid-equal mb-24">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Services by Bookings</div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {topServices.map((svc, i) => {
              const bookings = svc.totalBookings ?? svc.bookings ?? 0;
              const maxBookings = topServices[0]?.totalBookings ?? topServices[0]?.bookings ?? 1;
              return (
                <div key={svc._id ?? svc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ width: 20, fontSize: 13, color: 'var(--c-text-muted)', fontWeight: 600 }}>#{i+1}</span>
                  <span style={{ fontSize: 18 }}>{svc.icon ?? '✨'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{svc.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-brand-primary)' }}>{bookings.toLocaleString()}</span>
                    </div>
                    <div style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-full)', height: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 'var(--r-full)',
                        background: `linear-gradient(90deg, var(--c-brand-teal-mid), var(--c-brand-secondary))`,
                        width: `${(bookings / maxBookings) * 100}%`,
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">User & Partner Growth</div>
            <div className="card-subtitle">Last 8 weeks</div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={userGrowthData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="u" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Line yAxisId="u" type="monotone" dataKey="users"    name="Users"    stroke="#064081" strokeWidth={2} dot={false} />
                <Line yAxisId="p" type="monotone" dataKey="partners" name="Partners" stroke="#FF9500" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Bookings + Online Partners */}
      <div className="charts-grid charts-grid-equal">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Bookings</div>
              <div className="card-subtitle">Latest 6 transactions</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/bookings')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b._id ?? b.id}>
                    <td>
                      <div className="table-cell-main">{b.userName ?? b.user?.name ?? '—'}</div>
                      <div className="table-cell-sub">{b.bookingCode ?? b._id ?? b.id}</div>
                    </td>
                    <td>{b.service?.name ?? b.service ?? b.services?.[0]?.name ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{(b.amount ?? b.totalAmount ?? 0).toLocaleString('en-IN')}</td>
                    <td><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Online Partners</div>
              <div className="card-subtitle">{onlinePartners.length} partners currently active</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/partners')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {onlinePartners.map(p => (
              <div key={p._id ?? p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--c-border-light)' }}>
                <div className="table-avatar">{p.avatar ?? p.name?.[0] ?? 'P'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>{(p.services?.[0]?.name ?? p.services?.[0] ?? '—')} · {p.city}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge status="online" label="Online" />
                  <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>★ {p.rating ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
