import React, { useState, useMemo, useEffect } from 'react';
import { Search, Mail, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useContacts } from '../hooks/useContacts';

const ITEMS_PER_PAGE = 15;

const STATUS_CONFIG = {
  new:         { label: 'New',         bg: '#FEF3C7', text: '#92400E',  dot: '#F59E0B' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', text: '#1E40AF',  dot: '#3B82F6' },
  resolved:    { label: 'Resolved',    bg: '#D1FAE5', text: '#065F46',  dot: '#10B981' },
};

const SUBJECT_ICON = {
  'General Inquiry':                  '💬',
  'Booking Support':                  '📅',
  'Partner / Professional Inquiry':   '🤝',
  'Refund or Cancellation':           '🔄',
  'Press / Media':                    '📰',
  'Business Partnership':             '💼',
  'Feedback':                         '⭐',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.text,
      padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

export default function ContactInquiries() {
  const { showToast } = useAuth();
  const { fetchList, action } = useContacts();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const [notes, setNotes]         = useState('');

  useEffect(() => {
    fetchList().then(res => {
      if (res.ok) setInquiries(res.data?.data ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return inquiries.filter(i =>
      (!q || i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q) || i.subject?.toLowerCase().includes(q) || i.message?.toLowerCase().includes(q))
      && (statusFilter === 'all' || i.status === statusFilter)
    );
  }, [inquiries, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData   = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = useMemo(() => ({
    total:       inquiries.length,
    new:         inquiries.filter(i => i.status === 'new').length,
    in_progress: inquiries.filter(i => i.status === 'in_progress').length,
    resolved:    inquiries.filter(i => i.status === 'resolved').length,
  }), [inquiries]);

  const updateStatus = async (id, status) => {
    const adminNotes = selected?.adminNotes || '';
    const res = await action('patch', `/api/v1/contacts/${id}`, { status, adminNotes });
    if (res.ok) {
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      if (selected?.id === id) setSelected(s => ({ ...s, status }));
      showToast(`Marked as ${STATUS_CONFIG[status]?.label}.`, 'success');
    } else {
      showToast(res.error || 'Failed to update.', 'danger');
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    const res = await action('patch', `/api/v1/contacts/${selected.id}`, { status: selected.status, adminNotes: notes });
    if (res.ok) {
      setInquiries(prev => prev.map(i => i.id === selected.id ? { ...i, adminNotes: notes } : i));
      setSelected(s => ({ ...s, adminNotes: notes }));
      showToast('Notes saved.', 'success');
    } else {
      showToast(res.error || 'Failed to save notes.', 'danger');
    }
  };

  const openDetail = (inq) => {
    setSelected(inq);
    setNotes(inq.adminNotes || '');
    if (inq.status === 'new') updateStatus(inq.id, 'in_progress');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      {/* Summary cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Inquiries', value: counts.total,       icon: <Mail size={20} />,         color: '#6366F1', bg: '#EEF2FF' },
          { label: 'New',             value: counts.new,         icon: <MessageSquare size={20} />, color: '#F59E0B', bg: '#FEF3C7' },
          { label: 'In Progress',     value: counts.in_progress, icon: <Clock size={20} />,         color: '#3B82F6', bg: '#DBEAFE' },
          { label: 'Resolved',        value: counts.resolved,    icon: <CheckCircle size={20} />,   color: '#10B981', bg: '#D1FAE5' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text-primary)', lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', marginTop: 3 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <Search size={16} />
            <input className="search-input" placeholder="Search by name, email, subject or message…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          {pageData.length === 0 ? (
            <div className="table-empty" style={{ padding: '60px 20px' }}>
              <Mail size={36} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 12px' }} />
              <p>No contact inquiries{statusFilter !== 'all' ? ' with this status' : ''} yet.</p>
            </div>
          ) : pageData.map(inq => (
            <div key={inq.id}
              onClick={() => openDetail(inq)}
              style={{
                border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '16px 20px',
                marginBottom: 10, background: 'white', cursor: 'pointer', transition: 'var(--t-fast)',
                borderLeft: `4px solid ${STATUS_CONFIG[inq.status]?.dot || '#E5E7EB'}`,
              }}
              onMouseOver={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = ''}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                  <div className="table-avatar" style={{ width: 36, height: 36, fontSize: 12, flexShrink: 0 }}>
                    {inq.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{inq.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{inq.email}</span>
                      {inq.phone && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>· {inq.phone}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>{SUBJECT_ICON[inq.subject] || '📩'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-primary)' }}>{inq.subject}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                      {inq.message?.length > 120 ? inq.message.slice(0, 120) + '…' : inq.message}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <StatusBadge status={inq.status} />
                  <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                    {new Date(inq.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span style={{ padding: '0 4px', color: 'var(--c-text-muted)' }}>…</span>}
                    <button className={`pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  </React.Fragment>
                ))}
              <button className="pagination-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Contact Inquiry"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            <button className="btn btn-primary" onClick={saveNotes}>Save Notes</button>
            {selected?.status !== 'resolved' && (
              <button className="btn btn-success" onClick={() => { updateStatus(selected.id, 'resolved'); setSelected(null); }}>
                <CheckCircle size={14} /> Mark Resolved
              </button>
            )}
          </>
        }
      >
        {selected && (
          <div>
            {/* Sender info */}
            <div className="form-grid form-grid-2" style={{ gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-md)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>From</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{selected.email}</div>
                {selected.phone && <div style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{selected.phone}</div>}
              </div>
              <div style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-md)', padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Details</div>
                <div style={{ marginBottom: 6 }}><StatusBadge status={selected.status} /></div>
                <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
                  Received: {new Date(selected.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Subject</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F1F5F9', padding: '6px 14px', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 600 }}>
                {SUBJECT_ICON[selected.subject] || '📩'} {selected.subject}
              </div>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Message</div>
              <div style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-md)', padding: 16 }}>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--c-text-primary)', whiteSpace: 'pre-wrap', margin: 0 }}>{selected.message}</p>
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Admin Notes</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add internal notes about this inquiry…"
                style={{ width: '100%', minHeight: 100, padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--c-border)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: 'var(--c-text-primary)', background: 'white' }}
                onFocus={e => e.target.style.borderColor = 'var(--c-brand-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
