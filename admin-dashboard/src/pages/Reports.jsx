import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, Users, UserCog, Star } from 'lucide-react';
import api from '../services/api';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formatAmount, formatRupee } from '../utils/format';

const exportCSV = (data, headers, filename) => {
  const csv = [headers, ...data.map(r => headers.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`))].map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
};

const printReport = () => window.print();

const COLORS = ['#064081','#02B0E8','#FF9500','#FDD77A','#22C55E','#8B5CF6','#EF4444','#F59E0B'];

const TABS = ['Revenue','Bookings','User Growth','Partner Performance','Service Analytics'];

const RANGE_MONTHS = { '12m': 12, '6m': 6, '3m': 3 };

const fmtRupee = v => `₹${(v/1000).toFixed(0)}k`;

// Cards show large sums in Indian units (lakh/crore) rather than a raw rupee figure.
const fmtCompact = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}k`;
  return formatRupee(n);
};

const fmtNum = (v) => formatAmount(v);

// A month key like "2026-08" reads better on an axis as "Aug 26".
const fmtMonth = (m) => {
  if (!m || typeof m !== 'string') return m ?? '';
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return isNaN(d) ? m : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const withMonthLabel = (rows) => (rows ?? []).map(r => ({ ...r, month: fmtMonth(r.month) }));

// Stat cards carry a factual sub-line (what the number is made of) instead of the
// invented "+18% vs prev period" deltas this page used to print under every figure.
const StatCards = ({ items }) => (
  <div className="stats-grid" style={{ marginBottom:24 }}>
    {items.map(s => (
      <div key={s.label} className="stat-card">
        <div className="stat-label">{s.label}</div>
        <div className="stat-value" style={{ fontSize:22 }}>{s.value}</div>
        {s.sub && (
          <div style={{ fontSize:12, color:'var(--c-text-secondary)', fontWeight:500, marginTop:4 }}>{s.sub}</div>
        )}
      </div>
    ))}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'12px 16px', boxShadow:'var(--shadow-lg)' }}>
      <p style={{ fontWeight:700, marginBottom:6, fontSize:13 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:'var(--c-text-secondary)' }}>{p.name}:</span>
          <span style={{ fontWeight:600 }}>{typeof p.value === 'number' && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const EmptyChart = ({ label }) => (
  <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--c-text-muted)', fontSize:13 }}>
    {label}
  </div>
);

export default function Reports() {
  const { cityParam } = useCityFilter();
  const [activeTab, setTab] = useState('Revenue');
  const [dateRange, setDR] = useState('12m');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // The whole page comes from one aggregate: every stat card and every chart series is
  // measured server-side. Previously the cards were hardcoded literals and the booking
  // chart was derived from revenue with invented ratios.
  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    const params = { months: RANGE_MONTHS[dateRange] ?? 12, ...(cityParam ? { cityIds: cityParam } : {}) };
    api.get('/api/v1/admin/reports/summary', { params })
      .then(res => { if (res.data?.data) setSummary(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dateRange, cityParam]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true));

  const revenue  = summary?.revenue  ?? { total:0, platformEarnings:0, partnerPayouts:0, avgMonthly:0, series:[] };
  const bookings = summary?.bookings ?? { total:0, completed:0, cancelled:0, completionRate:0, cancellationRate:0, avgPerDay:0, series:[] };
  const users    = summary?.users    ?? { total:0, newThisMonth:0, retentionRate:0, avgBookingsPerUser:0, series:[] };
  const partnerPerf = summary?.partnerPerformance ?? [];
  const serviceRev  = summary?.topServices ?? [];

  const revenueSeries  = withMonthLabel(revenue.series);
  const bookingSeries  = withMonthLabel(bookings.series);
  const userSeries     = withMonthLabel(users.series);
  const rangeLabel     = `last ${RANGE_MONTHS[dateRange] ?? 12} months`;
  // Bar widths scale to the largest service in the set rather than a fixed divisor.
  const maxServiceCount = Math.max(1, ...serviceRev.map(s => s.count ?? 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Business performance and analytics{summary ? ` · ${rangeLabel}` : ''}</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <select className="filter-select" value={dateRange} onChange={e => setDR(e.target.value)}>
            <option value="12m">Last 12 months</option>
            <option value="6m">Last 6 months</option>
            <option value="3m">Last 3 months</option>
          </select>
          <button className="btn btn-outline btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={printReport}>
            Print
          </button>
          <button className="btn btn-secondary btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }}
                  onClick={() => exportCSV(revenue.series, ['month','revenue','commission','payout'], 'revenue-report.csv')}>
            <Download size={15}/> Export CSV
          </button>
        </div>
      </div>

      <div className="report-tabs" style={{ marginBottom:24 }}>
        {TABS.map(t => (
          <div key={t} className={`report-tab ${activeTab===t?'active':''}`} onClick={() => setTab(t)}>{t}</div>
        ))}
      </div>

      {loading && !summary && (
        <div className="card"><div className="card-body"><EmptyChart label="Loading reports…"/></div></div>
      )}

      {activeTab === 'Revenue' && (
        <div>
          <StatCards items={[
            { label:`Total Revenue (${rangeLabel})`, value: fmtCompact(revenue.total),            sub:'completed bookings, incl. GST' },
            { label:'Platform Earnings',             value: fmtCompact(revenue.platformEarnings), sub:'admin share after partner cut' },
            { label:'Partner Payouts',               value: fmtCompact(revenue.partnerPayouts),   sub:'partner share, pre-tax' },
            { label:'Avg Monthly Revenue',           value: fmtCompact(revenue.avgMonthly),       sub:`over ${revenue.series.length || 0} month(s) with revenue` },
          ]}/>

          <div className="card mb-24">
            <div className="card-header"><div className="card-title">Monthly Revenue Breakdown</div></div>
            <div className="card-body">
              {revenueSeries.length === 0 ? <EmptyChart label="No completed bookings in this period."/> : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueSeries} margin={{ top:4, right:8, left:8, bottom:0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#064081" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#064081" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#02B0E8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#02B0E8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                    <XAxis dataKey="month" tick={{ fontSize:12 }}/>
                    <YAxis tickFormatter={fmtRupee} tick={{ fontSize:12 }}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8}/>
                    <Area type="monotone" dataKey="revenue"    name="Revenue"    stroke="#064081" fill="url(#revGrad)"  strokeWidth={2}/>
                    <Area type="monotone" dataKey="commission" name="Commission" stroke="#02B0E8" fill="url(#commGrad)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="payout"     name="Partner Payout" stroke="#FF9500" fill="none" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Bookings' && (
        <div>
          <StatCards items={[
            { label:`Total Bookings (${rangeLabel})`, value: fmtNum(bookings.total),           sub:'all statuses' },
            { label:'Completion Rate',                value: `${bookings.completionRate}%`,    sub:`${fmtNum(bookings.completed)} completed` },
            { label:'Cancellation Rate',              value: `${bookings.cancellationRate}%`,  sub:`${fmtNum(bookings.cancelled)} cancelled` },
            { label:'Avg Bookings/Day',               value: bookings.avgPerDay,               sub:`across ${summary?.period?.days ?? 0} days` },
          ]}/>

          <div className="card">
            <div className="card-header"><div className="card-title">Monthly Booking Trends</div></div>
            <div className="card-body">
              {bookingSeries.length === 0 ? <EmptyChart label="No bookings in this period."/> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingSeries} margin={{ top:4, right:8, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                    <XAxis dataKey="month" tick={{ fontSize:12 }}/>
                    <YAxis tick={{ fontSize:12 }}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8}/>
                    <Bar dataKey="bookings"  name="Total"     fill="#064081" radius={[3,3,0,0]}/>
                    <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[3,3,0,0]}/>
                    <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'User Growth' && (
        <div>
          <StatCards items={[
            { label:'Total Users',       value: fmtNum(users.total),           sub:'all registered users' },
            { label:'New This Month',    value: fmtNum(users.newThisMonth),    sub:'signups since the 1st' },
            { label:'Retention Rate',    value: `${users.retentionRate}%`,     sub:'customers with 2+ bookings' },
            { label:'Avg Bookings/User', value: users.avgBookingsPerUser,      sub:'among users who booked' },
          ]}/>

          <div className="card">
            <div className="card-header"><div className="card-title">Monthly User &amp; Partner Growth</div></div>
            <div className="card-body">
              {userSeries.length === 0 ? <EmptyChart label="No signups in this period."/> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userSeries} margin={{ top:4, right:8, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                    <XAxis dataKey="month" tick={{ fontSize:11 }}/>
                    <YAxis yAxisId="u" tick={{ fontSize:11 }}/>
                    <YAxis yAxisId="p" orientation="right" tick={{ fontSize:11 }}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8}/>
                    <Line yAxisId="u" type="monotone" dataKey="users"    name="Users"    stroke="#064081" strokeWidth={2.5} dot={{ r:4 }}/>
                    <Line yAxisId="p" type="monotone" dataKey="partners" name="Partners" stroke="#FF9500" strokeWidth={2.5} dot={{ r:4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Partner Performance' && (
        <div>
          <div className="card mb-24">
            <div className="card-header"><div className="card-title">Top Partner Performance</div></div>
            <div className="card-body">
              {partnerPerf.length === 0 ? <EmptyChart label="No completed jobs by any partner in this period."/> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={partnerPerf} layout="vertical" margin={{ top:4, right:24, left:40, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false}/>
                    <XAxis type="number" tick={{ fontSize:11 }}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize:12 }} width={80}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Legend iconType="circle" iconSize={8}/>
                    <Bar dataKey="jobs"     name="Completed Jobs" fill="#064081" radius={[0,3,3,0]}/>
                    <Bar dataKey="earnings" name="Earnings (₹)"   fill="#02B0E8" radius={[0,3,3,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Partner Earnings Breakdown</div></div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Partner</th><th>Completed Jobs</th><th>Rating</th><th>Earnings ({rangeLabel})</th></tr></thead>
                <tbody>
                  {partnerPerf.length === 0 ? (
                    <tr><td colSpan={4} className="table-empty"><p>No partner performance data available.</p></td></tr>
                  ) : partnerPerf.map((p, i) => (
                    <tr key={i}>
                      <td><div style={{ fontWeight:600 }}>{p.name}</div></td>
                      <td style={{ fontWeight:600 }}>{p.jobs ?? 0}</td>
                      <td><span style={{ color:'#FDD77A', fontWeight:700 }}>★ {p.rating ?? 0}</span></td>
                      <td style={{ fontWeight:700, color:'var(--c-brand-primary)' }}>{formatRupee(p.earnings)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Service Analytics' && (
        <div>
          <div className="charts-grid charts-grid-equal mb-24">
            <div className="card">
              <div className="card-header"><div className="card-title">Revenue by Service</div></div>
              <div className="card-body">
                {serviceRev.length === 0 ? <EmptyChart label="No completed bookings in this period."/> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={serviceRev.slice(0,7)} cx="50%" cy="50%" outerRadius={100} dataKey="revenue" nameKey="name">
                        {serviceRev.slice(0,7).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={v => `₹${v.toLocaleString()}`}/>
                      <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:12 }}>{v}</span>}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Bookings by Service</div></div>
              <div className="card-body">
                {serviceRev.length === 0 ? <EmptyChart label="No completed bookings in this period."/> : serviceRev.map((s,i) => (
                  <div key={s.name} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }}/>
                    <span style={{ fontSize:13, width:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                    <div style={{ flex:1, background:'var(--c-border)', borderRadius:'var(--r-full)', height:8 }}>
                      <div style={{ height:'100%', borderRadius:'var(--r-full)', background:COLORS[i%COLORS.length], width:`${((s.count ?? 0) / maxServiceCount) * 100}%` }}/>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, width:40, textAlign:'right' }}>{s.count ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
