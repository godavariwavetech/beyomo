import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, Download, Eye, Ban, CheckCircle, ShieldCheck, Phone, Mail, MapPin, Star, Briefcase, XCircle, Clock, Check } from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { Badge, StarRating } from '../components/common/Badge';
import Modal from '../components/common/Modal';

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

function StepBar({ current }) {
  const steps = [{ n: 1, label: 'Basic Info' }, { n: 2, label: 'Categories' }, { n: 3, label: 'Skills' }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
      {steps.map(({ n, label }, i) => (
        <React.Fragment key={n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}>
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
  const { cityParam } = useCityFilter();
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
  const [addForm, setAddForm]         = useState({ name: '', phone: '', email: '', city: '', experience: '' });
  const [selectedCats, setSelectedCats]     = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [regCats, setRegCats]         = useState([]);
  const [regServices, setRegServices] = useState([]);
  const [regLoading, setRegLoading]   = useState(false);

  useEffect(() => {
    const params = cityParam ? { cityIds: cityParam } : {};
    fetchList(params).then(res => {
      if (res.ok) setPartners((res.data?.data ?? []).map(normalizePartner));
      setPageLoading(false);
    });
  }, [cityParam]);

  // Load categories + services when the wizard opens
  useEffect(() => {
    if (!adding) return;
    setRegLoading(true);
    Promise.all([
      action('get', '/api/v1/admin/services/categories'),
      action('get', '/api/v1/admin/services?limit=500'),
    ]).then(([cRes, sRes]) => {
      if (cRes.ok) setRegCats(cRes.data?.data ?? []);
      if (sRes.ok) {
        const raw = sRes.data?.data;
        setRegServices(Array.isArray(raw) ? raw : (raw?.data ?? []));
      }
      setRegLoading(false);
    });
  }, [adding]);

  const resetAdd = () => {
    setAddStep(1);
    setAddForm({ name: '', phone: '', email: '', city: '', experience: '' });
    setSelectedCats([]);
    setSelectedSkills([]);
  };

  const toggleCat = (id) => setSelectedCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const toggleSkill = (id) => setSelectedSkills(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const nextStep = () => {
    if (addStep === 1) {
      if (!addForm.name?.trim() || !addForm.phone?.trim()) {
        showToast('Name and phone are required.', 'danger');
        return;
      }
      setAddStep(2);
    } else if (addStep === 2) {
      if (selectedCats.length === 0) {
        showToast('Please select at least one category.', 'danger');
        return;
      }
      // Prune skills that belong to removed categories
      const validIds = new Set(
        regServices.filter(s => selectedCats.includes(s.categoryId)).map(s => s.id)
      );
      setSelectedSkills(p => p.filter(id => validIds.has(id)));
      setAddStep(3);
    }
  };

  const addPartner = async () => {
    const res = await action('post', '/api/v1/admin/partners', {
      ...addForm,
      categories: selectedCats,
      skills: selectedSkills,
    });
    if (res.ok) {
      fetchList().then(r => { if (r.ok) setPartners((r.data?.data ?? []).map(normalizePartner)); });
      showToast('Partner added! Pending verification.', 'success');
    } else {
      showToast(res.error ?? 'Failed to add partner.', 'danger');
    }
    setAdding(false);
    resetAdd();
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

  // Categories grid for step 2
  const CatGrid = () => (
    regLoading ? (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', fontSize: 13 }}>Loading categories…</div>
    ) : regCats.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', fontSize: 13 }}>No categories found. Add categories in the Services page first.</div>
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {regCats.map(cat => {
          const active = selectedCats.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCat(cat.id)}
              style={{
                border: `2px solid ${active ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                borderRadius: 10,
                padding: '12px 8px',
                textAlign: 'center',
                background: active ? '#e8f0fe' : 'white',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--c-brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={10} color="white" />
                </div>
              )}
              {cat.icon && (
                <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>{cat.icon}</div>
              )}
              <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--c-brand-primary)' : 'var(--c-text-primary)', lineHeight: 1.3 }}>
                {cat.name}
              </div>
            </button>
          );
        })}
      </div>
    )
  );

  // Skills checkboxes for step 3, grouped by selected category
  const SkillsGrid = () => (
    regLoading ? (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', fontSize: 13 }}>Loading skills…</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {selectedCats.map(catId => {
          const cat = regCats.find(c => c.id === catId);
          const catSvcs = regServices.filter(s => s.categoryId === catId || s.categoryId === Number(catId));
          return (
            <div key={catId}>
              <div style={{
                fontSize: 13, fontWeight: 700, marginBottom: 10,
                color: 'var(--c-brand-primary)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {cat?.icon && <span>{cat.icon}</span>}
                {cat?.name ?? `Category ${catId}`}
              </div>
              {catSvcs.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--c-text-muted)', fontStyle: 'italic', margin: 0 }}>No services in this category.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {catSvcs.map(svc => {
                    const checked = selectedSkills.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px',
                          border: `1.5px solid ${checked ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                          borderRadius: 20,
                          background: checked ? '#e8f0fe' : 'white',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: checked ? 600 : 400,
                          color: checked ? 'var(--c-brand-primary)' : 'var(--c-text-primary)',
                          transition: 'all 0.15s',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSkill(svc.id)}
                          style={{ display: 'none' }}
                        />
                        {checked && <Check size={11} />}
                        {svc.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
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
      {addStep < 3 ? (
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
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>New partners registered via the app and are waiting for approval.</div>
          </div>
          <button className="btn btn-sm" style={{ background:'white', color:'#92400e', fontWeight:700, border:'none' }} onClick={() => setStatus('pending')}>
            Review Now
          </button>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(5,1fr)', marginBottom:24 }}>
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
                      <button className="btn btn-ghost btn-icon" title="View" onClick={() => { setSelected(p); setTab('info'); }}><Eye size={15}/></button>
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
        <StepBar current={addStep} />

        {addStep === 1 && (
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="e.g. Sonal Kapoor" value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-input" placeholder="+91 99000 11001" value={addForm.phone} onChange={e => setAddForm(f => ({...f, phone: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="partner@gmail.com" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Mumbai" value={addForm.city} onChange={e => setAddForm(f => ({...f, city: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience</label>
                <input className="form-input" placeholder="3 yrs" value={addForm.experience} onChange={e => setAddForm(f => ({...f, experience: e.target.value}))} />
              </div>
            </div>
          </div>
        )}

        {addStep === 2 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16 }}>
              Select the service categories this partner specialises in.
            </p>
            <CatGrid />
            {selectedCats.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--c-text-muted)' }}>
                {selectedCats.length} categor{selectedCats.length === 1 ? 'y' : 'ies'} selected
              </div>
            )}
          </div>
        )}

        {addStep === 3 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16 }}>
              Pick the specific skills this partner offers within the selected categories.
            </p>
            <SkillsGrid />
            {selectedSkills.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--c-text-muted)' }}>
                {selectedSkills.length} skill{selectedSkills.length === 1 ? '' : 's'} selected
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Partner Detail Modal ── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Partner Details" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
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
              {['info','jobs','earnings'].map(t => (
                <div key={t} className={`detail-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            {tab === 'info' && (
              <>
                <div className="mini-stats" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
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

            {tab === 'jobs' && (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--c-text-secondary)' }}>
                <Briefcase size={32} style={{ margin:'0 auto 12px', opacity:0.4, display:'block' }} />
                <p>No jobs found for this partner.</p>
              </div>
            )}

            {tab === 'earnings' && (
              <div>
                <div className="mini-stats" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
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
    </div>
  );
}
