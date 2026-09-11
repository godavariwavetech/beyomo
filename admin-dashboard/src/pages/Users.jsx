import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Download, Eye, Ban, CheckCircle, Phone, Mail, MapPin, Calendar, ShoppingBag, DollarSign } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const exportCSV = (data, filename) => {
  const headers = ['ID','Name','Phone','Email','Joined','Bookings','Total Spent','Status'];
  const rows = data.map(u => [u.id, u.name, u.phone, u.email, u.joinedDate, u.bookings, u.totalSpent, u.status]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
};

const ITEMS_PER_PAGE = 8;

export default function Users() {
  const { showToast } = useAuth();
  const { fetchList, action } = useUsers();
  const { cityParam } = useCityFilter();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [sortBy, setSort]         = useState('joinedDate');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const [tab, setTab]             = useState('info');
  const [users, setUsers]         = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [adding, setAdding]       = useState(false);
  const [addForm, setAddForm]     = useState({});

  const loadUsers = () => {
    const params = cityParam ? { cityIds: cityParam } : {};
    fetchList(params).then(res => {
      if (res.ok) setUsers((res.data?.data ?? []).map(u => ({
        ...u,
        id: String(u.id ?? ''),
        name: u.name ?? '—',
        email: u.email ?? '',
        phone: u.phone ?? '',
        status: u.status ?? 'active',
        joinedDate: u.joinedDate ?? u.createdAt?.slice(0, 10) ?? '',
        bookings: u.bookings ?? 0,
        totalSpent: parseFloat(u.totalSpent ?? u.walletBalance ?? 0),
        avatar: u.avatar ?? (u.name?.[0]?.toUpperCase() ?? 'U'),
      })));
      setPageLoading(false);
    });
  };

  useEffect(() => { loadUsers(); }, [cityParam]);
  useAutoRefresh(loadUsers);

  const filtered = useMemo(() => {
    let list = users.filter(u => {
      const q = search.toLowerCase();
      return (!q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.id.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
          && (statusFilter === 'all' || u.status === statusFilter);
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'bookings')    return b.bookings - a.bookings;
      if (sortBy === 'totalSpent')  return b.totalSpent - a.totalSpent;
      if (sortBy === 'name')        return a.name.localeCompare(b.name);
      return new Date(b.joinedDate) - new Date(a.joinedDate);
    });
    return list;
  }, [users, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleStatus = async (id) => {
    const u = users.find(u => (u._id ?? u.id) === id);
    const newStatus = u.status === 'active' ? 'blocked' : 'active';
    const res = await action('patch', `/api/v1/admin/users/${id}/status`, {status: newStatus});
    if (res.ok) {
      setUsers(prev => prev.map(u => (u._id ?? u.id) === id ? {...u, status: newStatus} : u));
      showToast(`${u.name} ${newStatus === 'blocked' ? 'blocked' : 'activated'} successfully.`, newStatus === 'blocked' ? 'danger' : 'success');
      if (selected && (selected._id ?? selected.id) === id) setSelected(prev => ({...prev, status: newStatus}));
    } else {
      showToast(res.error, 'danger');
    }
  };

  const addUser = () => {
    if (!addForm.name || !addForm.phone) { showToast('Name and phone are required.','danger'); return; }
    action('post', '/api/v1/admin/users', addForm).then(res => {
      if (res.ok) {
        fetchList().then(r => { if (r.ok) setUsers((r.data?.data ?? []).map(u => ({ ...u, id: String(u.id ?? ''), name: u.name ?? '—', email: u.email ?? '', phone: u.phone ?? '', status: u.status ?? 'active', joinedDate: u.joinedDate ?? u.createdAt?.slice(0,10) ?? '', bookings: u.bookings ?? 0, totalSpent: parseFloat(u.totalSpent ?? u.walletBalance ?? 0), avatar: u.avatar ?? (u.name?.[0]?.toUpperCase() ?? 'U') }))); });
        showToast('User added successfully!','success');
      } else {
        showToast(res.error, 'danger');
      }
      setAdding(false); setAddForm({});
    });
  };

  const stats = {
    total:     users.length,
    active:    users.filter(u => u.status === 'active').length,
    blocked: users.filter(u => u.status === 'blocked').length,
    newMonth:  users.filter(u => {
      const d = u.joinedDate ?? u.createdAt ?? '';
      return d >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
    }).length,
  };

  // `selected.bookings` is the booking COUNT from the list endpoint, not the rows.
  // The detail panel needs the actual bookings, so fetch them when the tab is opened.
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'bookings' || !selected?.id) return;
    let cancelled = false;
    setBookingsLoading(true);
    action('get', '/api/v1/admin/bookings', null, { userId: selected.id, limit: 100 }).then(res => {
      if (cancelled) return;
      const raw = res.ok ? (res.data?.data?.data ?? res.data?.data ?? []) : [];
      setUserBookings(raw.map(b => ({
        ...b,
        id: String(b.id ?? ''),
        code: b.bookingCode ?? String(b.id ?? ''),
        service: b.service?.name ?? b.services?.[0]?.name ?? '—',
        partnerName: b.partner?.name ?? b.partnerName ?? 'Unassigned',
        amount: parseFloat(b.totalAmount ?? b.amount ?? 0),
        date: b.scheduledAt
          ? new Date(b.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '',
      })));
      setBookingsLoading(false);
    });
    return () => { cancelled = true; };
  }, [tab, selected?.id, action]);

  // Drop stale rows when switching to a different user.
  useEffect(() => { setUserBookings([]); }, [selected?.id]);

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Users',       value: stats.total,     color: '#064081' },
          { label: 'Active',            value: stats.active,    color: '#22C55E' },
          { label: 'Blocked',            value: stats.blocked,   color: '#EF4444' },
          { label: 'New This Month',    value: stats.newMonth,  color: '#FF9500' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search by name, phone, email or ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <select className="filter-select" value={sortBy} onChange={e => setSort(e.target.value)}>
            <option value="joinedDate">Newest First</option>
            <option value="name">Name A–Z</option>
            <option value="bookings">Most Bookings</option>
            <option value="totalSpent">Highest Spend</option>
          </select>
          <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => exportCSV(filtered, 'users.csv')}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { setAdding(true); setAddForm({}); }}>
            <UserPlus size={14} /> Add User
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Bookings</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">
                  <Search size={32} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 8px' }} />
                  <p>No users found for your filters.</p>
                </td></tr>
              ) : pageData.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="table-avatar">{u.avatar.slice(0,2)}</div>
                      <div>
                        <div className="table-cell-main">{u.name}</div>
                        <div className="table-cell-sub">{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--c-text-secondary)', fontSize: 13 }}>{u.phone}</td>
                  <td style={{ fontSize: 13 }}>{new Date(u.joinedDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                  <td style={{ fontWeight: 600, textAlign: 'center' }}>{u.bookings}</td>
                  <td style={{ fontWeight: 600 }}>₹{u.totalSpent.toLocaleString('en-IN')}</td>
                  <td><Badge status={u.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon" title="View Details" onClick={() => { setSelected(u); setTab('info'); }}>
                        <Eye size={15} />
                      </button>
                      <button
                        className={`btn btn-icon ${u.status === 'active' ? 'btn-ghost' : 'btn-ghost'}`}
                        title={u.status === 'active' ? 'Suspend' : 'Activate'}
                        onClick={() => toggleStatus(u.id)}
                        style={{ color: u.status === 'active' ? 'var(--c-danger)' : 'var(--c-success)' }}
                      >
                        {u.status === 'active' ? <Ban size={15} /> : <CheckCircle size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)}–{Math.min(page*ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p => p-1)} disabled={page === 1}>‹</button>
            {Array.from({length: totalPages}, (_,i) => i+1).filter(p => p===1||p===totalPages||Math.abs(p-page)<=1).map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx-1] !== p-1 && <span style={{padding:'0 4px',color:'var(--c-text-muted)'}}>…</span>}
                <button className={`pagination-btn ${page===p?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              </React.Fragment>
            ))}
            <button className="pagination-btn" onClick={() => setPage(p => p+1)} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add New User" size="sm"
        // A stray backdrop click discarded a half-filled new-user form.
        dismissOnBackdrop={false}
        dismissOnEscape={false}
        footer={<><button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={addUser}>Add User</button></>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" placeholder="e.g. Priya Sharma" value={addForm.name||''} onChange={e => setAddForm(f=>({...f,name:e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-input" placeholder="9876543210" maxLength={10} value={addForm.phone||''} onChange={e => setAddForm(f=>({...f,phone:e.target.value.replace(/\D/g, '').slice(0, 10)}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="user@gmail.com" value={addForm.email||''} onChange={e => setAddForm(f=>({...f,email:e.target.value}))}/>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="User Details" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected && (
              <button
                className={`btn ${selected.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                onClick={() => toggleStatus(selected.id)}
              >
                {selected.status === 'active' ? 'Suspend User' : 'Activate User'}
              </button>
            )}
          </>
        }
      >
        {selected && (
          <div>
            <div className="detail-profile">
              <div className="detail-avatar">{selected.avatar.slice(0,2)}</div>
              <div className="detail-info">
                <h3>{selected.name}</h3>
                <p>{selected.id} · <Badge status={selected.status} /></p>
              </div>
            </div>

            <div className="detail-tabs">
              {['info','bookings','addresses'].map(t => (
                <div key={t} className={`detail-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            {tab === 'info' && (
              <>
                <div className="mini-stats" style={{ marginBottom: 20 }}>
                  <div className="mini-stat"><div className="value">{selected.bookings ?? 0}</div><div className="label">Bookings</div></div>
                  <div className="mini-stat"><div className="value">₹{((selected.totalSpent ?? 0)/1000).toFixed(1)}k</div><div className="label">Total Spent</div></div>
                  <div className="mini-stat"><div className="value">{selected.addresses ?? 0}</div><div className="label">Addresses</div></div>
                </div>
                <div className="detail-grid">
                  {[
                    { icon: <Phone size={14}/>, label:'Phone',       value: selected.phone },
                    { icon: <Mail  size={14}/>, label:'Email',       value: selected.email },
                    { icon: <Calendar size={14}/>, label:'Joined',   value: new Date(selected.joinedDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) },
                    { icon: <Calendar size={14}/>, label:'Last Active', value: (selected.updatedAt ?? selected.createdAt) ? new Date(selected.updatedAt ?? selected.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '—' },
                    { icon: <MapPin size={14}/>, label:'Addresses',  value: `${selected.addresses ?? 0} saved address${(selected.addresses ?? 0) !== 1 ? 'es' : ''}` },
                    { icon: <DollarSign size={14}/>, label:'Avg. Order', value: selected.bookings ? `₹${Math.round(selected.totalSpent/selected.bookings).toLocaleString('en-IN')}` : '—' },
                  ].map(item => (
                    <div key={item.label} className="detail-item">
                      <div className="label" style={{ display:'flex', alignItems:'center', gap:4 }}>{item.icon} {item.label}</div>
                      <div className="value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'bookings' && (
              bookingsLoading ? (
                <div style={{ textAlign:'center', padding: '40px 0', color:'var(--c-text-secondary)' }}>
                  <p>Loading bookings…</p>
                </div>
              ) : userBookings.length === 0 ? (
                <div style={{ textAlign:'center', padding: '40px 0', color:'var(--c-text-secondary)' }}>
                  <ShoppingBag size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>No bookings yet for this user.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Booking ID</th><th>Service</th><th>Partner</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {userBookings.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontSize:12, color:'var(--c-text-secondary)' }}>{b.code}</td>
                          <td>{b.service}</td>
                          <td style={{ fontSize:13 }}>{b.partnerName}</td>
                          <td style={{ fontWeight:600 }}>₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</td>
                          <td><Badge status={b.status} /></td>
                          <td style={{ fontSize:13 }}>{b.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'addresses' && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--c-text-secondary)' }}>
                <MapPin size={32} style={{ margin:'0 auto 12px', opacity:0.4, display:'block' }} />
                <p>Address details available in the mobile app.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
