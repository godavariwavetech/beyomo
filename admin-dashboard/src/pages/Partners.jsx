import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Download, Eye, Ban, CheckCircle, ShieldCheck, Phone, Mail, MapPin, Star, Briefcase, XCircle, Clock, Check, Pencil, User, Tag } from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import api from '../services/api';
import { Badge, StarRating } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ImageUploader from '../components/common/ImageUploader';

const exportCSV = (data, filename) => {
  const headers = ['ID','Name','Phone','Email','City','Services','Rating','Total Jobs','Monthly Earnings','Status'];
  const rows = data.map(p => [p.id, p.name, p.phone, p.email, p.city, p.services.join(';'), p.rating, p.totalJobs, p.monthlyEarnings, p.status]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: filename });
  a.click(); URL.revokeObjectURL(a.href);
};

const normalizePartner = (p) => ({
  ...p,
  id: String(p.id ?? ''),
  city: p.city ?? p.locationCity ?? '—',
  rating: parseFloat(p.rating ?? p.ratingsAverage ?? 0),
  totalJobs: p.totalJobs ?? p.ratingsCount ?? 0,
  monthlyEarnings: parseFloat(p.monthlyEarnings ?? 0),
  totalEarnings: parseFloat(p.totalEarnings ?? 0),
  isOnline: p.isOnline ?? false,
  services: Array.isArray(p.services) ? p.services : [],
  avatar: p.avatar ?? (p.name?.[0]?.toUpperCase() ?? 'P'),
  experience: typeof p.experience === 'number' ? `${p.experience} yrs` : (p.experience ?? '—'),
  status: p.status === 'approved' ? 'active' : (p.status ?? 'pending'),
});

// Fixed profession list — matches the partner mobile app's registration screen exactly
const PROFESSIONS = ['Beautician', 'Hairdresser', 'Makeup Artist', 'Mehendi', 'Spa Therapist', 'Aesthetician'];

function StepBar({ current, onStepClick }) {
  const steps = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Profession' },
    { n: 3, label: 'Skills' },
    { n: 4, label: 'Documents' },
    { n: 5, label: 'Bank Details' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {steps.map(({ n, label }, i) => (
        <React.Fragment key={n}>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64, cursor: onStepClick ? 'pointer' : 'default' }}
            onClick={() => onStepClick?.(n)}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: current >= n ? 'var(--c-brand-primary)' : '#e2e8f0',
              color: current >= n ? 'white' : '#94a3b8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, transition: 'background 0.2s',
            }}>
              {current > n ? <Check size={14} /> : n}
            </div>
            <div style={{
              fontSize: 11, marginTop: 4,
              fontWeight: current === n ? 600 : 400,
              color: current >= n ? 'var(--c-text-primary)' : '#94a3b8',
              whiteSpace: 'nowrap',
            }}>{label}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 4px', marginBottom: 20,
              background: current > n ? 'var(--c-brand-primary)' : '#e2e8f0',
              transition: 'background 0.2s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const ITEMS_PER_PAGE = 8;

export default function Partners() {
  const { showToast } = useAuth();
  const { fetchList, action } = usePartners();
  const { cityParam, cities } = useCityFilter();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [onlineFilter, setOnline] = useState('all');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const [tab, setTab]             = useState('info');
  const [partners, setPartners]   = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [adding, setAdding]       = useState(false);

  // Wizard state
  const [addStep, setAddStep]         = useState(1);
  const [addForm, setAddForm]         = useState({
    name: '', phone: '', email: '', city: '', experience: '', gender: '',
    profilePicture: '', aadharUrl: '', agreementUrl: '',
    bankAccountNo: '', bankIfsc: '', bankName: '', bankHolderName: '',
  });
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [regCats, setRegCats]       = useState([]);
  const [regLoading, setRegLoading] = useState(false);

  // Edit Details state
  const [editing, setEditing]   = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', city: '', experience: '', gender: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadPartners = () => {
    const params = { source: 'app', ...(cityParam ? { cityIds: cityParam } : {}) };
    fetchList(params).then(res => {
      if (res.ok) setPartners((res.data?.data ?? []).map(normalizePartner));
      setPageLoading(false);
    });
  };

  useEffect(() => { loadPartners(); }, [cityParam]);
  useAutoRefresh(loadPartners);

  // Load service categories (for the optional Skills step) when the wizard opens
  useEffect(() => {
    if (!adding) return;
    setRegLoading(true);
    action('get', '/api/v1/admin/services/categories').then(res => {
      if (res.ok) setRegCats(res.data?.data ?? []);
      setRegLoading(false);
    });
  }, [adding]);

  const resetAdd = () => {
    setAddStep(1);
    setAddForm({
      name: '', phone: '', email: '', city: '', experience: '', gender: '',
      profilePicture: '', aadharUrl: '', agreementUrl: '',
      bankAccountNo: '', bankIfsc: '', bankName: '', bankHolderName: '',
    });
    setSelectedProfessions([]);
    setSelectedCats([]);
  };

  const openEdit = (p) => {
    setEditForm({
      name: p.name ?? '',
      phone: p.phone ?? '',
      email: p.email ?? '',
      city: p.city && p.city !== '—' ? p.city : '',
      experience: typeof p.experience === 'string' ? p.experience.replace(/\s*yrs$/, '') : (p.experience ?? ''),
      gender: p.gender ?? '',
    });
    setEditing(p);
  };

  const saveEdit = async () => {
    if (!editForm.name?.trim() || !editForm.phone?.trim()) {
      showToast('Name and phone are required.', 'danger');
      return;
    }
    setSavingEdit(true);
    const res = await action('patch', `/api/v1/admin/partners/${editing.id}`, editForm);
    setSavingEdit(false);
    if (res.ok) {
      const updated = normalizePartner(res.data?.data ?? { ...editing, ...editForm });
      setPartners(prev => prev.map(p => p.id === editing.id ? { ...p, ...updated } : p));
      if (selected?.id === editing.id) setSelected(prev => ({ ...prev, ...updated }));
      showToast('Partner details updated.', 'success');
      setEditing(null);
    } else {
      showToast(res.error ?? 'Failed to update partner.', 'danger');
    }
  };

  const toggleProfession = (p) => setSelectedProfessions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  const toggleCat = (id) => setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const nextStep = () => {
    if (addStep === 1 && (!addForm.name?.trim() || !addForm.phone?.trim())) {
      showToast('Name and phone are required.', 'danger');
      return;
    }
    setAddStep(s => s + 1);
  };

  const addPartner = async () => {
    // Jumping straight to a later step via the step bar can skip the Basic Info
    // validation in nextStep() — re-check the required fields here before submitting.
    if (!addForm.name?.trim() || !addForm.phone?.trim()) {
      showToast('Name and phone are required.', 'danger');
      setAddStep(1);
      return;
    }
    const res = await action('post', '/api/v1/admin/partners', {
      ...addForm,
      professions: selectedProfessions,
      categories: selectedCats,
    });
    if (res.ok) {
      fetchList().then(r => { if (r.ok) setPartners((r.data?.data ?? []).map(normalizePartner)); });
      showToast('Partner added! Pending verification.', 'success');
      setAdding(false);
      resetAdd();
    } else {
      // Keep the modal open with the entered data so the admin doesn't have to redo everything
      showToast(res.error ?? 'Failed to add partner.', 'danger');
    }
  };

  const filtered = useMemo(() => {
    return partners.filter(p => {
      const q = search.toLowerCase();
      return (!q || p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.id.toLowerCase().includes(q) || p.services.some(s => s.toLowerCase().includes(q)))
          && (statusFilter === 'all' || p.status === statusFilter)
          && (onlineFilter === 'all' || (onlineFilter === 'online' ? p.isOnline : !p.isOnline));
    });
  }, [partners, search, statusFilter, onlineFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData   = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const toggleStatus = async (id) => {
    const p = partners.find(q => q.id === id);
    const apiStatus = p.status === 'active' ? 'suspended' : 'approved';
    const localStatus = p.status === 'active' ? 'suspended' : 'active';
    const res = await action('patch', `/api/v1/admin/partners/${id}/status`, {status: apiStatus});
    if (res.ok) {
      setPartners(prev => prev.map(q => q.id === id ? { ...q, status: localStatus } : q));
      showToast(`${p.name} ${localStatus === 'suspended' ? 'suspended' : 'activated'}.`, localStatus === 'suspended' ? 'danger' : 'success');
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: localStatus }));
    } else {
      showToast(res.error ?? 'Failed to update partner status.', 'danger');
    }
  };

  const verifyPartner = async (id) => {
    const res = await action('patch', `/api/v1/admin/partners/${id}/status`, {status: 'approved'});
    if (res.ok) {
      setPartners(prev => prev.map(p => (p._id ?? p.id) === id ? {...p, status: 'active'} : p));
      const p = partners.find(p => (p._id ?? p.id) === id);
      showToast(`${p?.name} verified and activated!`, 'success');
      if (selected && (selected._id ?? selected.id) === id) setSelected(prev => ({...prev, status: 'active'}));
    } else {
      showToast(res.error, 'danger');
    }
  };

  const rejectPartner = async (id) => {
    const res = await action('patch', `/api/v1/admin/partners/${id}/status`, {status: 'rejected'});
    if (res.ok) {
      setPartners(prev => prev.map(p => (p._id ?? p.id) === id ? {...p, status: 'rejected'} : p));
      const p = partners.find(p => (p._id ?? p.id) === id);
      showToast(`${p?.name ?? 'Partner'} application rejected.`, 'danger');
      if (selected && (selected._id ?? selected.id) === id) setSelected(prev => ({...prev, status: 'rejected'}));
    } else {
      showToast(res.error ?? 'Failed to reject.', 'danger');
    }
  };

  const stats = {
    total:    partners.length,
    online:   partners.filter(p => p.isOnline).length,
    pending:  partners.filter(p => p.status === 'pending').length,
    suspended:partners.filter(p => p.status === 'suspended').length,
    topRated: partners.filter(p => (p.rating ?? 0) >= 4.7).length,
  };

  const pendingPartners = partners.filter(p => p.status === 'pending');

  // Profession chips for step 2 — fixed list matching the partner app's registration screen
  const ProfessionChips = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {PROFESSIONS.map(p => {
        const active = selectedProfessions.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => toggleProfession(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: `1.5px solid ${active ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
              borderRadius: 20,
              padding: '8px 16px',
              background: active ? '#e8f0fe' : 'white',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--c-brand-primary)' : 'var(--c-text-primary)',
              transition: 'all 0.15s',
            }}
          >
            {active && <Check size={12} />}
            {p}
          </button>
        );
      })}
    </div>
  );

  // Service category chips for step 3 (Skills) — optional, sourced from the Services catalog
  const CategoryChips = () => (
    regLoading ? (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', fontSize: 13 }}>Loading categories…</div>
    ) : regCats.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', fontSize: 13 }}>No categories found. Add categories in the Services page first.</div>
    ) : (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {regCats.map(cat => {
          const active = selectedCats.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCat(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: `1.5px solid ${active ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                borderRadius: 20,
                padding: '8px 16px',
                background: active ? '#e8f0fe' : 'white',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--c-brand-primary)' : 'var(--c-text-primary)',
                transition: 'all 0.15s',
              }}
            >
              {active && <Check size={12} />}
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          );
        })}
      </div>
    )
  );

  const addWizardFooter = (
    <>
      <button
        className="btn btn-outline"
        onClick={() => {
          if (addStep === 1) { setAdding(false); resetAdd(); }
          else setAddStep(s => s - 1);
        }}
      >
        {addStep === 1 ? 'Cancel' : '← Back'}
      </button>
      {addStep < 5 ? (
        <button className="btn btn-primary" onClick={nextStep}>Next →</button>
      ) : (
        <button className="btn btn-primary" onClick={addPartner}>Add Partner</button>
      )}
    </>
  );

  return (
    <div>
      {pendingPartners.length > 0 && (
        <div style={{ background:'linear-gradient(135deg,#92400e,#d97706)', borderRadius:'var(--r-lg)', padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'var(--r-md)', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Clock size={22} color="white"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'white' }}>{pendingPartners.length} Partner Application{pendingPartners.length > 1 ? 's' : ''} Awaiting Review</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>New applications from the app, waiting for approval. Website sign-ups are under Website Registrations.</div>
          </div>
          <button className="btn btn-sm" style={{ background:'white', color:'#92400e', fontWeight:700, border:'none' }} onClick={() => setStatus('pending')}>
            Review Now
          </button>
        </div>
      )}

      <div className="stats-grid stats-grid-5" style={{ marginBottom:24 }}>
        {[
          { label:'Total Partners', value:stats.total,     color:'#064081' },
          { label:'Online Now',     value:stats.online,    color:'#22C55E' },
          { label:'Pending Verify', value:stats.pending,   color:'#F59E0B' },
          { label:'Suspended',      value:stats.suspended, color:'#EF4444' },
          { label:'Top Rated (≥4.7)',value:stats.topRated, color:'#FDD77A' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search by name, phone, service or ID…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </select>
          <select className="filter-select" value={onlineFilter} onChange={e => { setOnline(e.target.value); setPage(1); }}>
            <option value="all">Online & Offline</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
          <button className="btn btn-outline btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => exportCSV(filtered, 'partners.csv')}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary btn-sm" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => { setAdding(true); setAddStep(1); resetAdd(); }}>
            <UserPlus size={14} /> Add Partner
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Services</th>
                <th>Rating</th>
                <th>Total Jobs</th>
                <th>Monthly Earnings</th>
                <th>Online</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">
                  <Search size={32} style={{ color:'var(--c-text-muted)', display:'block', margin:'0 auto 8px' }} />
                  <p>No partners match your filters.</p>
                </td></tr>
              ) : pageData.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="table-avatar">{p.avatar}</div>
                      <div>
                        <div className="table-cell-main">{p.name}</div>
                        <div className="table-cell-sub">{p.city} · {p.experience}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {(Array.isArray(p.services) ? p.services : []).map(s => (
                        <span key={s} style={{ background:'var(--c-border-light)', borderRadius:'var(--r-full)', padding:'2px 8px', fontSize:11, fontWeight:500 }}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td><StarRating rating={p.rating} size={13} /></td>
                  <td style={{ fontWeight:600, textAlign:'center' }}>{p.totalJobs}</td>
                  <td style={{ fontWeight:600 }}>₹{p.monthlyEarnings.toLocaleString('en-IN')}</td>
                  <td>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color: p.isOnline ? 'var(--c-success)' : 'var(--c-text-muted)' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background: p.isOnline ? 'var(--c-success)' : 'var(--c-border)', display:'inline-block' }} />
                      {p.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-ghost btn-icon" title="View" onClick={async () => {
                        setSelected(p); setTab('info');
                        const res = await action('get', `/api/v1/admin/partners/${p.id}`);
                        if (res.ok) setSelected(normalizePartner(res.data?.data ?? res.data));
                      }}><Eye size={15}/></button>
                      <button className="btn btn-ghost btn-icon" title="Edit Details" onClick={() => openEdit(p)}><Pencil size={15}/></button>
                      {p.status === 'pending' && (<>
                        <button className="btn btn-ghost btn-icon" title="Approve" onClick={() => verifyPartner(p.id)} style={{ color:'var(--c-success)' }}><ShieldCheck size={15}/></button>
                        <button className="btn btn-ghost btn-icon" title="Reject" onClick={() => rejectPartner(p.id)} style={{ color:'var(--c-danger)' }}><XCircle size={15}/></button>
                      </>)}
                      <button className="btn btn-ghost btn-icon" title={p.status==='active'?'Suspend':'Activate'} onClick={() => toggleStatus(p.id)} style={{ color: p.status==='active' ? 'var(--c-danger)' : 'var(--c-success)' }}>
                        {p.status === 'active' ? <Ban size={15}/> : <CheckCircle size={15}/>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)}–{Math.min(page*ITEMS_PER_PAGE, filtered.length)} of {filtered.length} partners</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p => p-1)} disabled={page===1}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,idx,arr)=>(
              <React.Fragment key={p}>
                {idx>0&&arr[idx-1]!==p-1&&<span style={{padding:'0 4px',color:'var(--c-text-muted)'}}>…</span>}
                <button className={`pagination-btn ${page===p?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              </React.Fragment>
            ))}
            <button className="pagination-btn" onClick={() => setPage(p => p+1)} disabled={page===totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* ── Add Partner Wizard ── */}
      <Modal
        isOpen={adding}
        onClose={() => { setAdding(false); resetAdd(); }}
        title="Add New Partner"
        size="lg"
        footer={addWizardFooter}
      >
        <StepBar current={addStep} onStepClick={setAddStep} />

        {addStep === 1 && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="e.g. Sonal Kapoor" value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-input" placeholder="9900011001" maxLength={10} value={addForm.phone} onChange={e => setAddForm(f => ({...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10)}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="partner@gmail.com" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div className="form-grid form-grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-input" value={addForm.city} onChange={e => setAddForm(f => ({...f, city: e.target.value}))}>
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Experience</label>
                <input className="form-input" placeholder="3 yrs" value={addForm.experience} onChange={e => setAddForm(f => ({...f, experience: e.target.value}))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input" value={addForm.gender} onChange={e => setAddForm(f => ({...f, gender: e.target.value}))}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>
        )}

        {addStep === 2 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16 }}>
              What is Your Profession? <span style={{ color: 'var(--c-text-muted)' }}>(optional)</span>
            </p>
            <ProfessionChips />
            {selectedProfessions.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--c-text-muted)' }}>
                {selectedProfessions.length} selected
              </div>
            )}
          </div>
        )}

        {addStep === 3 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16 }}>
              Which service categories does this partner specialise in? <span style={{ color: 'var(--c-text-muted)' }}>(optional)</span>
            </p>
            <CategoryChips />
            {selectedCats.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--c-text-muted)' }}>
                {selectedCats.length} selected
              </div>
            )}
          </div>
        )}

        {addStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', margin: 0 }}>
              Upload documents <span style={{ color: 'var(--c-text-muted)' }}>(optional)</span>
            </p>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Profile Photo</div>
              <ImageUploader
                value={addForm.profilePicture}
                onChange={url => setAddForm(f => ({...f, profilePicture: url}))}
                width={64} height={64}
                label="Upload Photo"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Aadhar Card</div>
              <ImageUploader
                value={addForm.aadharUrl}
                onChange={url => setAddForm(f => ({...f, aadharUrl: url}))}
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                label="Upload Aadhar"
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Signed Agreement</div>
              <ImageUploader
                value={addForm.agreementUrl}
                onChange={url => setAddForm(f => ({...f, agreementUrl: url}))}
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                label="Upload Agreement"
              />
            </div>
          </div>
        )}

        {addStep === 5 && (
          <div className="form-grid">
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', margin: 0 }}>
              Bank details for settlements <span style={{ color: 'var(--c-text-muted)' }}>(optional)</span>
            </p>
            <div className="form-group">
              <label className="form-label">Account Holder Name</label>
              <input className="form-input" value={addForm.bankHolderName} onChange={e => setAddForm(f => ({...f, bankHolderName: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input className="form-input" value={addForm.bankName} onChange={e => setAddForm(f => ({...f, bankName: e.target.value}))} />
            </div>
            <div className="form-grid form-grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input className="form-input" value={addForm.bankAccountNo} onChange={e => setAddForm(f => ({...f, bankAccountNo: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code</label>
                <input className="form-input" value={addForm.bankIfsc} onChange={e => setAddForm(f => ({...f, bankIfsc: e.target.value.toUpperCase()}))} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Partner Detail Modal ── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Partner Details" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected && (
              <button className="btn btn-outline" style={{ display:'flex', alignItems:'center', gap:6 }} onClick={() => openEdit(selected)}>
                <Pencil size={15}/> Edit Details
              </button>
            )}
            {selected?.status === 'pending' && (<>
              <button className="btn btn-danger" onClick={() => rejectPartner(selected.id)} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <XCircle size={15}/> Reject
              </button>
              <button className="btn btn-success" onClick={() => verifyPartner(selected.id)} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <ShieldCheck size={15}/> Approve
              </button>
            </>)}
            {selected && selected.status !== 'pending' && (
              <button className={`btn ${selected.status==='active'?'btn-danger':'btn-success'}`} onClick={() => toggleStatus(selected.id)}>
                {selected.status === 'active' ? 'Suspend Partner' : 'Activate Partner'}
              </button>
            )}
          </>
        }
      >
        {selected && (
          <div>
            <div className="detail-profile">
              <div className="detail-avatar">{selected.avatar}</div>
              <div className="detail-info">
                <h3>{selected.name}</h3>
                <p style={{ display:'flex', alignItems:'center', gap:8 }}>{selected.id} · <Badge status={selected.status} /> {selected.isOnline && <Badge status="online" label="Online"/>}</p>
              </div>
            </div>

            <div className="detail-tabs">
              {['info','documents','jobs','earnings'].map(t => (
                <div key={t} className={`detail-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            {tab === 'info' && (
              <>
                <div className="mini-stats" style={{ marginBottom:20 }}>
                  <div className="mini-stat"><div className="value">{selected.totalJobs}</div><div className="label">Total Jobs</div></div>
                  <div className="mini-stat"><div className="value">★{selected.rating}</div><div className="label">Rating</div></div>
                  <div className="mini-stat"><div className="value">₹{(selected.totalEarnings/1000).toFixed(0)}k</div><div className="label">Total Earned</div></div>
                </div>
                <div className="detail-grid">
                  {[
                    { icon:<Phone size={14}/>,     label:'Phone',      value:selected.phone },
                    { icon:<Mail size={14}/>,      label:'Email',      value:selected.email },
                    { icon:<MapPin size={14}/>,    label:'City',       value:selected.city },
                    { icon:<Briefcase size={14}/>, label:'Experience', value:selected.experience },
                    { icon:<User size={14}/>,      label:'Gender',     value:selected.gender ? (selected.gender.charAt(0).toUpperCase() + selected.gender.slice(1)) : '—' },
                    { icon:<Tag size={14}/>,       label:'Profession', value:(selected.professions ?? []).join(', ') || '—' },
                    { icon:<Star size={14}/>,      label:'Services',   value:selected.services.join(', ') || '—' },
                    { icon:<ShieldCheck size={14}/>,label:'Verified',  value:selected.verifiedAt ? new Date(selected.verifiedAt).toLocaleDateString('en-IN') : 'Not Verified Yet' },
                  ].map(item => (
                    <div key={item.label} className="detail-item">
                      <div className="label" style={{ display:'flex', alignItems:'center', gap:4 }}>{item.icon} {item.label}</div>
                      <div className="value">{item.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '8px 0' }}>
                {[
                  { label: 'Selfie / Profile Photo', key: 'profilePicture' },
                  { label: 'Aadhar Card', key: 'aadharUrl' },
                  { label: 'Signed Agreement', key: 'agreementUrl' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)', marginBottom: 8 }}>{label}</div>
                    {selected[key] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={`${api.defaults.baseURL}${selected[key]}`}
                          alt={label}
                          style={{ width: 180, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--c-border)' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <a
                          href={`${api.defaults.baseURL}${selected[key]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline btn-sm">
                          View Full
                        </a>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--c-text-muted)', fontStyle: 'italic' }}>Not uploaded yet</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'jobs' && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--c-text-secondary)' }}>
                <Briefcase size={32} style={{ margin:'0 auto 12px', opacity:0.4, display:'block' }} />
                <p>No jobs found for this partner.</p>
              </div>
            )}

            {tab === 'earnings' && (
              <div>
                <div className="mini-stats" style={{ marginBottom:20 }}>
                  <div className="mini-stat"><div className="value">₹{selected.monthlyEarnings.toLocaleString('en-IN')}</div><div className="label">This Month</div></div>
                  <div className="mini-stat"><div className="value">₹{(selected.totalEarnings/(selected.totalJobs||1)).toFixed(0)}</div><div className="label">Avg per Job</div></div>
                  <div className="mini-stat"><div className="value">₹{selected.totalEarnings.toLocaleString('en-IN')}</div><div className="label">All Time</div></div>
                </div>
                <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16, textAlign:'center', color:'var(--c-text-secondary)', fontSize:14 }}>
                  Detailed payout history available in the Earnings section.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Edit Partner Details Modal ── */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Partner Details"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-input" placeholder="9900011001" maxLength={10} value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10)}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div className="form-grid form-grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-input" value={editForm.city} onChange={e => setEditForm(f => ({...f, city: e.target.value}))}>
                <option value="">Select city</option>
                {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Experience</label>
              <input className="form-input" value={editForm.experience} onChange={e => setEditForm(f => ({...f, experience: e.target.value}))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-input" value={editForm.gender} onChange={e => setEditForm(f => ({...f, gender: e.target.value}))}>
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
