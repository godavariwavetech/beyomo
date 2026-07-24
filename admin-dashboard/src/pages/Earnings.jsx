import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Search, Download, DollarSign, TrendingUp, Percent, CreditCard } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { useEarnings } from '../hooks/useEarnings';
import { useReports } from '../hooks/useReports';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const exportCSV = (data, filename) => {
  const headers = ['Booking ID','Customer','Partner','Service','Amount','Commission','Partner Payout','Payment Method','Date'];
  const rows = data.map(t => [t._id??t.id, t.userName??t.user?.name??'', t.partnerName??t.partner?.name??'', t.service??t.services?.[0]?.name??'', t.amount??t.totalAmount??0, t.commission??0, (t.amount??t.totalAmount??0)-(t.commission??0), t.paymentMethod??'', t.date??t.createdAt??'']);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
};

const fmtCurrency = v => `₹${v.toLocaleString('en-IN')}`;

const SERVICE_COLORS = ['#064081','#02B0E8','#FF9500','#FDD77A','#22C55E','#8B5CF6','#EF4444','#F59E0B'];

export default function Earnings() {
  const { fetchList, action } = useEarnings();
  const { action: reportAction } = useReports();
  const { cityParam } = useCityFilter();
  const [dateRange, setDateRange] = useState('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [allTransactions, setAllTransactions] = useState([]);
  const [revenueData, setRevenueData]         = useState([]);
  const [serviceRevenue, setServiceRevenue]   = useState([]);
  const ITEMS = 8;

  const loadEarnings = () => {
    const params = cityParam ? { cityIds: cityParam } : {};
    fetchList(params).then(res => {
      if (res.ok && res.data?.data?.length) {
        setAllTransactions(res.data?.data);
      }
    });
    reportAction('get', '/api/v1/admin/reports/revenue', null, params).then(res => {
      const arr = res.data?.data?.data;
      if (res.ok && Array.isArray(arr) && arr.length) setRevenueData(arr);
    });
    reportAction('get', '/api/v1/admin/reports/bookings', null, params).then(res => {
      const arr = res.data?.data?.topServices;
      if (res.ok && Array.isArray(arr) && arr.length) setServiceRevenue(arr);
    });
  };

  useEffect(() => { loadEarnings(); }, [cityParam]);
  useAutoRefresh(loadEarnings);

  const transactions = allTransactions;

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase();
      const id = String(t._id ?? t.id ?? '').toLowerCase();
      const user = (t.userName ?? t.user?.name ?? '').toLowerCase();
      const partner = (t.partnerName ?? t.partner?.name ?? '').toLowerCase();
      const svc = (t.service?.name ?? t.service ?? t.services?.[0]?.name ?? '').toLowerCase();
      return !q || user.includes(q) || partner.includes(q) || id.includes(q) || svc.includes(q);
    });
  }, [transactions, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS);
  const pageData   = filtered.slice((page-1)*ITEMS, page*ITEMS);

  const totalRevenue    = transactions.reduce((a,t) => a + parseFloat(t.amount ?? t.totalAmount ?? 0), 0);
  const totalPayout     = transactions.reduce((a,t) => a + parseFloat(t.partnerEarning ?? t.partnerPayout ?? 0), 0);
  const totalCommission = totalRevenue - totalPayout;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'white', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'12px 16px', boxShadow:'var(--shadow-lg)' }}>
        <p style={{ fontWeight:700, marginBottom:6, fontSize:13 }}>{label}</p>
        {payload.map(p => (
          <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:p.color }} />
            <span style={{ color:'var(--c-text-secondary)' }}>{p.name}:</span>
            <span style={{ fontWeight:600 }}>₹{(p.value/1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[
          { icon:<DollarSign size={22}/>, label:'Total Revenue',       value:fmtCurrency(totalRevenue),    gradient:'linear-gradient(135deg,#064081,#0284c7)' },
          { icon:<Percent size={22}/>,    label:'Platform Commission', value:fmtCurrency(totalCommission), gradient:'linear-gradient(135deg,#0E5843,#16a34a)' },
          { icon:<CreditCard size={22}/>, label:'Partner Payouts',     value:fmtCurrency(totalPayout),     gradient:'linear-gradient(135deg,#FF9500,#f97316)' },
          { icon:<TrendingUp size={22}/>, label:'Avg. Order Value',    value:fmtCurrency(Math.round(totalRevenue/(transactions.length||1))), gradient:'linear-gradient(135deg,#02B0E8,#0891b2)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ background:s.gradient, border:'none', color:'white' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:22, fontWeight:800, color:'white' }}>{s.value}</div>
              </div>
              <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'var(--r-md)', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center' }}>{s.icon}</div>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>
              {s.label === 'Platform Commission' ? '20% of total revenue' :
               s.label === 'Partner Payouts' ? '80% goes to partners' :
               s.label === 'Avg. Order Value' ? `Based on ${transactions.length} transactions` :
               `${transactions.length} completed transactions`}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid charts-grid-equal mb-24">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Revenue Trend</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData} margin={{ top:4, right:8, left:8, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis dataKey="month" tick={{ fontSize:12 }} />
                <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fontSize:12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="commission" name="Commission" fill="#0E5843" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="payout"     name="Payout"     fill="#02B0E8" radius={[3,3,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Revenue by Service</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={serviceRevenue.slice(0,6)} cx="50%" cy="50%" outerRadius={90} dataKey="revenue" nameKey="name">
                  {serviceRevenue.slice(0,6).map((_, i) => <Cell key={i} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmtCurrency(v)} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Transaction History</div>
            <div className="card-subtitle">All completed payments</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div className="search-input-wrap" style={{ minWidth:220 }}>
              <Search size={16} />
              <input className="search-input" placeholder="Search transactions…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <button className="btn btn-outline btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => exportCSV(filtered, 'transactions.csv')}>
              <Download size={14}/> Export CSV
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Partner</th>
                <th>Service</th>
                <th>Total Amount</th>
                <th>Commission</th>
                <th>Partner Payout</th>
                <th>Payment Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={9} className="table-empty"><p>No transactions found.</p></td></tr>
              ) : pageData.map(t => {
                const tid = t._id ?? t.id;
                const amount = parseFloat(t.amount ?? t.totalAmount ?? 0);
                const payout = parseFloat(t.partnerEarning ?? t.partnerPayout ?? 0);
                const commission = t.commission ?? (amount > 0 && payout > 0 ? amount - payout : 0);
                return (
                  <tr key={tid}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, background:'var(--c-border-light)', padding:'2px 6px', borderRadius:'var(--r-sm)' }}>{t.bookingCode ?? tid}</span></td>
                    <td style={{ fontSize:13 }}>{t.userName ?? t.user?.name ?? '—'}</td>
                    <td style={{ fontSize:13 }}>{t.partnerName ?? t.partner?.name ?? '—'}</td>
                    <td>{t.service?.name ?? t.service ?? t.services?.[0]?.name ?? '—'}</td>
                    <td><span style={{ fontWeight:700, color:'var(--c-brand-primary)' }}>₹{amount.toLocaleString('en-IN')}</span></td>
                    <td><span style={{ color:'var(--c-success)', fontWeight:600 }}>₹{commission.toLocaleString('en-IN')}</span></td>
                    <td><span style={{ fontWeight:600 }}>₹{(amount - commission).toLocaleString('en-IN')}</span></td>
                    <td>
                      <span style={{ background:'var(--c-border-light)', padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:12, fontWeight:500 }}>{t.paymentMethod ?? t.payment?.method ?? '—'}</span>
                    </td>
                    <td style={{ fontSize:13 }}>{t.date ?? (t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page-1)*ITEMS+1, filtered.length)}–{Math.min(page*ITEMS, filtered.length)} of {filtered.length}</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p=>p-1)} disabled={page===1}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,idx,arr)=>(
              <React.Fragment key={p}>
                {idx>0&&arr[idx-1]!==p-1&&<span style={{padding:'0 4px',color:'var(--c-text-muted)'}}>…</span>}
                <button className={`pagination-btn ${page===p?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              </React.Fragment>
            ))}
            <button className="pagination-btn" onClick={() => setPage(p=>p+1)} disabled={page===totalPages}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
