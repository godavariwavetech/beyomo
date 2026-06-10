import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, Users, UserCog, Star } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { useCityFilter } from '../context/CityContext';

const exportCSV = (data, headers, filename) => {
  const csv = [headers, ...data.map(r => headers.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`))].map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
};

const printReport = () => window.print();

const COLORS = ['#064081','#02B0E8','#FF9500','#FDD77A','#22C55E','#8B5CF6','#EF4444','#F59E0B'];

const TABS = ['Revenue','Bookings','User Growth','Partner Performance','Service Analytics'];

const fmtRupee = v => `₹${(v/1000).toFixed(0)}k`;

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

export default function Reports() {
  const { action } = useReports();
  const { cityId } = useCityFilter();
  const [activeTab, setTab] = useState('Revenue');
  const [dateRange, setDR] = useState('12m');
  const [revenueData, setRevenueData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [partnerPerfData, setPartnerPerfData] = useState([]);
  const [serviceRevData, setServiceRevData] = useState([]);

  useEffect(() => {
    action('get', '/api/v1/admin/reports/revenue').then(res => {
      const arr = res.data?.data?.data;
      if (res.ok && Array.isArray(arr) && arr.length) setRevenueData(arr);
    });
    action('get', '/api/v1/admin/reports/users').then(res => {
      const arr = res.data?.data?.users;
      if (res.ok && Array.isArray(arr) && arr.length) setUserGrowthData(arr);
    });
    action('get', '/api/v1/admin/reports/bookings').then(res => {
      const arr = res.data?.data?.topServices;
      if (res.ok && Array.isArray(arr) && arr.length) setServiceRevData(arr);
    });
  }, [dateRange, cityId]);

  const bookingsByMonth = revenueData.map(r => ({
    month: r.month,
    bookings: r.bookings ?? Math.round(r.revenue / 1200),
    completed: r.completed ?? Math.round((r.bookings ?? r.revenue / 1200) * 0.85),
    cancelled: r.cancelled ?? Math.round((r.bookings ?? r.revenue / 1200) * 0.1),
  }));

  const partnerPerf = partnerPerfData;

  const serviceRev = serviceRevData;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div className="report-tabs" style={{ flex:1 }}>
          {TABS.map(t => (
            <div key={t} className={`report-tab ${activeTab===t?'active':''}`} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <select className="filter-select" value={dateRange} onChange={e => setDR(e.target.value)}>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
          </select>
          <button className="btn btn-outline btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={printReport}>
            <Download size={14}/> Export PDF
          </button>
          <button className="btn btn-secondary btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => exportCSV(revenueData, ['month','revenue','commission','payout'], 'revenue-report.csv')}>
            <Download size={14}/> Export CSV
          </button>
        </div>
      </div>

      {activeTab === 'Revenue' && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
            {[
              { label:'Total Revenue (12M)',    value:'₹43.24L', change:'+18%' },
              { label:'Platform Earnings',      value:'₹8.65L',  change:'+18%' },
              { label:'Partner Payouts',        value:'₹34.59L', change:'+18%' },
              { label:'Avg Monthly Revenue',    value:'₹3.60L',  change:'+5%' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:22 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--c-success)', fontWeight:600, marginTop:4 }}>{s.change} vs prev period</div>
              </div>
            ))}
          </div>

          <div className="card mb-24">
            <div className="card-header"><div className="card-title">Monthly Revenue Breakdown</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={revenueData} margin={{ top:4, right:8, left:8, bottom:0 }}>
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Bookings' && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
            {[
              { label:'Total Bookings (12M)', value:'3,842', change:'+22%' },
              { label:'Completion Rate',      value:'84.2%',  change:'+3.1%' },
              { label:'Cancellation Rate',    value:'9.6%',   change:'-1.2%' },
              { label:'Avg Bookings/Day',     value:'10.5',   change:'+8%' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:22 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--c-success)', fontWeight:600, marginTop:4 }}>{s.change}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Monthly Booking Trends</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bookingsByMonth} margin={{ top:4, right:8, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                  <XAxis dataKey="month" tick={{ fontSize:12 }}/>
                  <YAxis tick={{ fontSize:12 }}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconType="circle" iconSize={8}/>
                  <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[3,3,0,0]}/>
                  <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'User Growth' && (
        <div>
          <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
            {[
              { label:'Total Users',       value:'2,847', change:'+12%' },
              { label:'New This Month',    value:'145',   change:'+8 vs last' },
              { label:'Retention Rate',    value:'78.4%', change:'+2.3%' },
              { label:'Avg Bookings/User', value:'6.8',   change:'+0.4' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:22 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--c-success)', fontWeight:600, marginTop:4 }}>{s.change}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Weekly User & Partner Growth</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData} margin={{ top:4, right:8, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)"/>
                  <XAxis dataKey="week" tick={{ fontSize:11 }}/>
                  <YAxis yAxisId="u" tick={{ fontSize:11 }}/>
                  <YAxis yAxisId="p" orientation="right" tick={{ fontSize:11 }}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconType="circle" iconSize={8}/>
                  <Line yAxisId="u" type="monotone" dataKey="users"    name="Users"    stroke="#064081" strokeWidth={2.5} dot={{ r:4 }}/>
                  <Line yAxisId="p" type="monotone" dataKey="partners" name="Partners" stroke="#FF9500" strokeWidth={2.5} dot={{ r:4 }}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Partner Performance' && (
        <div>
          <div className="card mb-24">
            <div className="card-header"><div className="card-title">Top Partner Performance</div></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={partnerPerf} layout="vertical" margin={{ top:4, right:24, left:40, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" horizontal={false}/>
                  <XAxis type="number" tick={{ fontSize:11 }}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize:12 }} width={60}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend iconType="circle" iconSize={8}/>
                  <Bar dataKey="jobs" name="Total Jobs" fill="#064081" radius={[0,3,3,0]}/>
                  <Bar dataKey="earnings" name="Monthly Earnings (₹)" fill="#02B0E8" radius={[0,3,3,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">Partner Ratings Distribution</div></div>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Partner</th><th>Total Jobs</th><th>Rating</th><th>Monthly Earnings</th></tr></thead>
                <tbody>
                  {partnerPerfData.length === 0 ? (
                    <tr><td colSpan={4} className="table-empty"><p>No partner performance data available.</p></td></tr>
                  ) : partnerPerfData.map((p, i) => (
                    <tr key={i}>
                      <td><div style={{ fontWeight:600 }}>{p.name}</div></td>
                      <td style={{ fontWeight:600 }}>{p.jobs ?? 0}</td>
                      <td><span style={{ color:'#FDD77A', fontWeight:700 }}>★ {p.rating ?? 0}</span></td>
                      <td style={{ fontWeight:700, color:'var(--c-brand-primary)' }}>₹{(p.earnings ?? 0).toLocaleString('en-IN')}</td>
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
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={serviceRev.slice(0,7)} cx="50%" cy="50%" outerRadius={100} dataKey="revenue" nameKey="name">
                      {serviceRev.slice(0,7).map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={v => `₹${v.toLocaleString()}`}/>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:12 }}>{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Bookings by Service</div></div>
              <div className="card-body">
                {serviceRev.map((s,i) => (
                  <div key={s.name} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }}/>
                    <span style={{ fontSize:13, width:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
                    <div style={{ flex:1, background:'var(--c-border)', borderRadius:'var(--r-full)', height:8 }}>
                      <div style={{ height:'100%', borderRadius:'var(--r-full)', background:COLORS[i%COLORS.length], width:`${s.bookings/567*100}%` }}/>
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, width:40, textAlign:'right' }}>{s.bookings}</span>
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
