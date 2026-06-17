import React, { useState, useMemo, useEffect } from 'react';
import { Search, MessageCircle, CheckCircle, ThumbsUp, Bug, Lightbulb, Smartphone } from 'lucide-react';
import { Badge, StarRating } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../hooks/useFeedback';
import { useCityFilter } from '../context/CityContext';

const ITEMS_PER_PAGE = 10;

const TYPE_CONFIG = {
  service:    { label:'Service',    icon:'⭐',                     color:'#FDD77A', bg:'#FFFBEB', text:'#92400E' },
  app:        { label:'App',        icon:<Smartphone size={13}/>, color:'#3B82F6', bg:'#DBEAFE', text:'#1E40AF' },
  suggestion: { label:'Suggestion', icon:<Lightbulb size={13}/>, color:'#8B5CF6', bg:'#EDE9FE', text:'#5B21B6' },
  bug:        { label:'Bug Report', icon:<Bug size={13}/>,       color:'#EF4444', bg:'#FEE2E2', text:'#991B1B' },
};

const STATUS_CONFIG = {
  new:      { label:'New',      color:'var(--c-warning)',  bg:'var(--c-warning-bg)',  text:'var(--c-warning-text)' },
  reviewed: { label:'Reviewed', color:'var(--c-info)',     bg:'var(--c-info-bg)',     text:'var(--c-info-text)' },
  resolved: { label:'Resolved', color:'var(--c-success)',  bg:'var(--c-success-bg)', text:'var(--c-success-text)' },
};

export default function Feedback() {
  const { showToast } = useAuth();
  const { fetchList, action } = useFeedback();
  const { cityParam } = useCityFilter();
  const [feedback, setFeedback]   = useState([]);
  const [search, setSearch]       = useState('');
  const [typeFilter, setType]     = useState('all');
  const [statusFilter, setStatus] = useState('all');
  const [ratingFilter, setRating] = useState('all');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    const params = cityParam ? { cityIds: cityParam } : {};
    fetchList(params).then(res => { if (res.ok) setFeedback(res.data?.data ?? []); });
  }, [cityParam]);

  const filtered = useMemo(() => {
    return feedback.filter(f => {
      const q = search.toLowerCase();
      return (!q || f.userName.toLowerCase().includes(q) || f.message.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
          && (typeFilter === 'all' || f.type === typeFilter)
          && (statusFilter === 'all' || f.status === statusFilter)
          && (ratingFilter === 'all' || f.rating === +ratingFilter);
    });
  }, [feedback, search, typeFilter, statusFilter, ratingFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData   = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const markReviewed = async (id) => {
    const res = await action('patch', `/api/v1/admin/feedback/${id}/status`, {status: 'reviewed'});
    if (res.ok) {
      setFeedback(prev => prev.map(f => (f._id ?? f.id) === id ? {...f, status:'reviewed'} : f));
      showToast('Marked as reviewed.','success');
      if (selected && (selected._id ?? selected.id) === id) setSelected(f => ({...f, status:'reviewed'}));
    } else {
      showToast(res.error ?? 'Failed to update feedback.', 'danger');
    }
  };

  const markResolved = async (id) => {
    const res = await action('patch', `/api/v1/admin/feedback/${id}/status`, {status: 'resolved'});
    if (res.ok) {
      setFeedback(prev => prev.map(f => (f._id ?? f.id) === id ? {...f, status:'resolved'} : f));
      showToast('Marked as resolved.','success');
      if (selected && (selected._id ?? selected.id) === id) setSelected(f => ({...f, status:'resolved'}));
    } else {
      showToast(res.error ?? 'Failed to update feedback.', 'danger');
    }
  };



  return (
    <div>
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap" style={{ flex:1 }}>
            <Search size={16}/>
            <input className="search-input" placeholder="Search by user, message or category…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
          <select className="filter-select" value={typeFilter} onChange={e => { setType(e.target.value); setPage(1); }}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="filter-select" value={ratingFilter} onChange={e => { setRating(e.target.value); setPage(1); }}>
            <option value="all">All Ratings</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
          </select>
        </div>

        <div style={{ padding:'0 20px 20px' }}>
          {pageData.length === 0 ? (
            <div className="table-empty" style={{ padding:'60px 20px' }}>
              <MessageCircle size={36} style={{ color:'var(--c-text-muted)', display:'block', margin:'0 auto 12px' }}/>
              <p>No feedback matches your filters.</p>
            </div>
          ) : pageData.map(f => {
            const typeCfg = TYPE_CONFIG[f.type] || {};
            const statusCfg = STATUS_CONFIG[f.status] || {};
            return (
              <div key={f.id} style={{
                border:'1px solid var(--c-border)', borderRadius:'var(--r-lg)', padding:'16px 20px',
                marginBottom:12, background:'white', transition:'var(--t-fast)',
                borderLeft:`4px solid ${typeCfg.color||'var(--c-border)'}`,
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Top row */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                      <div className="table-avatar" style={{ width:32, height:32, fontSize:12, flexShrink:0 }}>
                        {f.userName.split(' ').map(w=>w[0]).join('').slice(0,2)}
                      </div>
                      <span style={{ fontWeight:600, fontSize:14 }}>{f.userName}</span>
                      <span style={{ fontSize:12, color:'var(--c-text-muted)' }}>·</span>
                      <span style={{ fontSize:12, color:'var(--c-text-secondary)' }}>
                        {new Date(f.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                      <span style={{ background:typeCfg.bg, color:typeCfg.text, padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                        {typeCfg.icon} {typeCfg.label}
                      </span>
                      <span style={{ background:statusCfg.bg, color:statusCfg.text, padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700 }}>
                        {statusCfg.label}
                      </span>
                      {f.rating && <StarRating rating={f.rating} size={12}/>}
                    </div>
                    {/* Message */}
                    <p style={{ fontSize:14, color:'var(--c-text-primary)', lineHeight:1.6, margin:'0 0 8px' }}>
                      {f.message.length > 180 ? f.message.slice(0,180)+'…' : f.message}
                    </p>
                    {/* Meta */}
                    <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--c-text-muted)', flexWrap:'wrap' }}>
                      {f.serviceBooked && <span>📌 {f.serviceBooked}</span>}
                      <span>📱 App v{f.version}</span>
                      <span>🏷 {f.category}</span>
                      <span style={{ color:'var(--c-text-muted)', fontFamily:'monospace' }}>{f.id}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(f)} style={{ fontSize:12 }}>
                      View Full
                    </button>
                    {f.status === 'new' && (
                      <button className="btn btn-sm" style={{ background:'var(--c-info-bg)', color:'var(--c-info-text)', border:'none', fontSize:12 }} onClick={() => markReviewed(f.id)}>
                        Mark Reviewed
                      </button>
                    )}
                    {f.status !== 'resolved' && (
                      <button className="btn btn-sm" style={{ background:'var(--c-success-bg)', color:'var(--c-success-text)', border:'none', fontSize:12 }} onClick={() => markResolved(f.id)}>
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pagination">
          <span className="pagination-info">
            Showing {filtered.length === 0 ? 0 : Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)}–{Math.min(page*ITEMS_PER_PAGE, filtered.length)} of {filtered.length} feedback items
          </span>
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

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Feedback Details"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected?.status === 'new' && (
              <button className="btn btn-primary" onClick={() => { markReviewed(selected.id); }}>
                <CheckCircle size={14}/> Mark Reviewed
              </button>
            )}
            {selected?.status !== 'resolved' && (
              <button className="btn btn-success" onClick={() => { markResolved(selected.id); setSelected(null); }}>
                <ThumbsUp size={14}/> Resolve
              </button>
            )}
          </>
        }
      >
        {selected && (() => {
          const typeCfg = TYPE_CONFIG[selected.type] || {};
          const statusCfg = STATUS_CONFIG[selected.status] || {};
          return (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--c-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>User</div>
                  <div style={{ fontWeight:600 }}>{selected.userName}</div>
                  <div style={{ fontSize:12, color:'var(--c-text-secondary)' }}>{selected.userId}</div>
                </div>
                <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--c-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Details</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span style={{ background:typeCfg.bg, color:typeCfg.text, padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700 }}>{typeCfg.label}</span>
                    <span style={{ background:statusCfg.bg, color:statusCfg.text, padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:11, fontWeight:700 }}>{statusCfg.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginTop:6 }}>v{selected.version} · {selected.category}</div>
                </div>
              </div>

              {selected.rating && (
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                  <StarRating rating={selected.rating} size={20}/>
                  <span style={{ fontSize:14, color:'var(--c-text-secondary)' }}>{selected.rating}/5 stars</span>
                  {selected.serviceBooked && <span style={{ fontSize:13, background:'var(--c-border-light)', padding:'2px 10px', borderRadius:'var(--r-full)' }}>📌 {selected.serviceBooked}</span>}
                </div>
              )}

              <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <MessageCircle size={18} style={{ color:'var(--c-brand-primary)', marginTop:2, flexShrink:0 }}/>
                  <p style={{ fontSize:15, lineHeight:1.7, color:'var(--c-text-primary)' }}>{selected.message}</p>
                </div>
              </div>

              <div style={{ fontSize:12, color:'var(--c-text-secondary)', display:'flex', gap:16 }}>
                <span>Submitted: {new Date(selected.submittedAt).toLocaleString('en-IN', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                <span style={{ fontFamily:'monospace' }}>{selected.id}</span>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
