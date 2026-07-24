import React, { useState, useMemo, useEffect } from 'react';
import { Search, Eye, ShieldCheck, XCircle, Clock, Phone, Mail, MapPin, Briefcase, Tag } from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';

const normalize = (p) => ({
  ...p,
  id: String(p.id ?? ''),
  city: p.locationCity ?? '—',
  serviceCategoryIds: Array.isArray(p.serviceCategoryIds) ? p.serviceCategoryIds : [],
  professions: Array.isArray(p.professions) ? p.professions : [],
  avatar: p.name?.[0]?.toUpperCase() ?? 'P',
  appliedAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
});

const ITEMS_PER_PAGE = 10;

export default function WebsiteRegistrations() {
  const { showToast } = useAuth();
  const { fetchList, action } = usePartners();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [leads, setLeads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const loadLeads = () => {
    Promise.all([
      fetchList({ source: 'website', limit: 200 }),
      action('get', '/api/v1/admin/services/categories'),
    ]).then(([leadsRes, catsRes]) => {
      if (leadsRes.ok) setLeads((leadsRes.data?.data ?? []).map(normalize));
      if (catsRes.ok) setCategories(catsRes.data?.data ?? []);
      setPageLoading(false);
    });
  };

  useEffect(() => { loadLeads(); }, []);
  useAutoRefresh(loadLeads);

  const categoryName = (id) => categories.find(c => c.id === id)?.name ?? `#${id}`;

  const interestedIn = (p) => (p.professions.length > 0 ? p.professions : p.serviceCategoryIds.map(categoryName));

  const filtered = useMemo(() => {
    return leads.filter(p => {
      const q = search.toLowerCase();
      return (!q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q))
          && (statusFilter === 'all' || p.status === statusFilter);
    });
  }, [leads, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const pendingCount = leads.filter(p => p.status === 'pending').length;

  const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  const statusCount = (key) => key === 'all' ? leads.length : leads.filter(p => p.status === key).length;

  const setStatus = async (id, status) => {
    const res = await action('patch', `/api/v1/admin/partners/${id}/status`, { status });
    if (res.ok) {
      setLeads(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      showToast(`Application ${status}.`, status === 'rejected' ? 'danger' : 'success');
      if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
    } else {
      showToast(res.error ?? 'Failed to update application.', 'danger');
    }
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)', borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-md)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Clock size={22} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Partner Sign-ups From the Website</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {pendingCount} application{pendingCount === 1 ? '' : 's'} submitted via the "Join Now" form, awaiting review.
          </div>
        </div>
      </div>

      <div className="report-tabs">
        {STATUS_TABS.map(t => (
          <div
            key={t.key}
            className={`report-tab ${statusFilter === t.key ? 'active' : ''}`}
            onClick={() => { setStatusFilter(t.key); setPage(1); }}
          >
            {t.label} ({statusCount(t.key)})
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search by name or phone…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>City</th>
                <th>Interested In</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageLoading ? (
                <tr><td colSpan={6} className="table-empty"><p>Loading…</p></td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">
                  <Search size={32} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 8px' }} />
                  <p>No website registrations match your filters.</p>
                </td></tr>
              ) : pageData.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="table-avatar">{p.avatar}</div>
                      <div>
                        <div className="table-cell-main">{p.name}</div>
                        <div className="table-cell-sub">{p.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.city}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {interestedIn(p).length === 0 ? '—' : interestedIn(p).map(label => (
                        <span key={label} style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-full)', padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{label}</span>
                      ))}
                    </div>
                  </td>
                  <td>{p.appliedAt}</td>
                  <td><Badge status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon" title="View" onClick={() => setSelected(p)}><Eye size={15} /></button>
                      {p.status === 'pending' && (<>
                        <button className="btn btn-ghost btn-icon" title="Approve" onClick={() => setStatus(p.id, 'approved')} style={{ color: 'var(--c-success)' }}><ShieldCheck size={15} /></button>
                        <button className="btn btn-ghost btn-icon" title="Reject" onClick={() => setStatus(p.id, 'rejected')} style={{ color: 'var(--c-danger)' }}><XCircle size={15} /></button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} registrations</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            <button className="pagination-btn active">{page}</button>
            <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          </div>
        </div>
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Website Application" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected?.status === 'pending' && (<>
              <button className="btn btn-danger" onClick={() => setStatus(selected.id, 'rejected')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={15} /> Reject
              </button>
              <button className="btn btn-success" onClick={() => setStatus(selected.id, 'approved')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} /> Approve
              </button>
            </>)}
          </>
        }
      >
        {selected && (
          <div>
            <div className="detail-profile">
              <div className="detail-avatar">{selected.avatar}</div>
              <div className="detail-info">
                <h3>{selected.name}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Badge status={selected.status} /></p>
              </div>
            </div>

            <div className="detail-grid">
              {[
                { icon: <Phone size={14} />, label: 'Phone', value: selected.phone },
                { icon: <Mail size={14} />, label: 'Email', value: selected.email || '—' },
                { icon: <MapPin size={14} />, label: 'City', value: selected.city },
                { icon: <Briefcase size={14} />, label: 'Experience', value: `${selected.experience ?? 0} yrs` },
                { icon: <Tag size={14} />, label: 'Interested In', value: interestedIn(selected).join(', ') || '—' },
                { icon: <Clock size={14} />, label: 'Applied On', value: selected.appliedAt },
              ].map(item => (
                <div key={item.label} className="detail-item">
                  <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{item.icon} {item.label}</div>
                  <div className="value">{item.value}</div>
                </div>
              ))}
            </div>

            {(selected.profilePicture || selected.aadharUrl || selected.agreementUrl) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                {[
                  { label: 'Selfie / Profile Photo', key: 'profilePicture' },
                  { label: 'Aadhar Card', key: 'aadharUrl' },
                  { label: 'Signed Agreement', key: 'agreementUrl' },
                ].filter(({ key }) => selected[key]).map(({ label, key }) => (
                  <div key={key}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-secondary)', marginBottom: 8 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={`${api.defaults.baseURL}${selected[key]}`}
                        alt={label}
                        style={{ width: 180, height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--c-border)' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <a href={`${api.defaults.baseURL}${selected[key]}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View Full</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
