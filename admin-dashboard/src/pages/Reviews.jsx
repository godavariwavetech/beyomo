import React, { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, Flag, Trash2, MessageSquare } from 'lucide-react';
import { Badge, StarRating } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../hooks/useReviews';
import { useCityFilter } from '../context/CityContext';

const ITEMS_PER_PAGE = 8;

export default function Reviews() {
  const { showToast } = useAuth();
  const { fetchList, action } = useReviews();
  const { cityId } = useCityFilter();
  const [reviews, setReviews] = useState([]);
  const [search, setSearch]   = useState('');
  const [statusFilter, setSF] = useState('all');
  const [ratingFilter, setRF] = useState('all');
  const [page, setPage]       = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchList(cityId ? { cityId } : {}).then(res => {
      if (res.ok) setReviews((res.data?.data ?? []).map(r => ({
        ...r,
        id: String(r._id ?? r.id ?? ''),
        userName: r.user?.name ?? r.userName ?? '—',
        userId: r.userId ?? r.user?._id ?? '',
        partnerName: r.partner?.name ?? r.partnerName ?? '—',
        service: r.service?.name ?? r.service ?? '—',
        comment: r.comment ?? '',
        date: r.date ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'),
        status: r.status ?? 'visible',
      })));
    });
  }, [cityId]);

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const q = search.toLowerCase();
      return (!q || r.userName.toLowerCase().includes(q) || r.partnerName.toLowerCase().includes(q) || r.service.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q))
          && (statusFilter === 'all' || r.status === statusFilter)
          && (ratingFilter === 'all' || r.rating === +ratingFilter);
    });
  }, [reviews, search, statusFilter, ratingFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData   = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const approveReview = async (id) => {
    const res = await action('patch', `/api/v1/admin/reviews/${id}/status`, {status: 'visible'});
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id===id ? {...r, status:'visible'} : r));
      showToast('Review made visible!', 'success');
      if (selected?.id === id) setSelected(r => ({...r, status:'visible'}));
    } else {
      showToast(res.error ?? 'Failed to update review.', 'danger');
    }
  };

  const flagReview = async (id) => {
    const res = await action('patch', `/api/v1/admin/reviews/${id}/status`, {status: 'hidden'});
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id===id ? {...r, status:'hidden'} : r));
      showToast('Review hidden.', 'warning');
      if (selected?.id === id) setSelected(r => ({...r, status:'hidden'}));
    } else {
      showToast(res.error ?? 'Failed to update review.', 'danger');
    }
  };

  const deleteReview = (id) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast('Review deleted.', 'danger');
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div>
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16}/>
            <input className="search-input" placeholder="Search reviews…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => { setSF(e.target.value); setPage(1); }}>
            <option value="all">All Status</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <select className="filter-select" value={ratingFilter} onChange={e => { setRF(e.target.value); setPage(1); }}>
            <option value="all">All Ratings</option>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Partner</th>
                <th>Service</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr><td colSpan={8} className="table-empty">
                  <MessageSquare size={32} style={{ color:'var(--c-text-muted)', display:'block', margin:'0 auto 8px' }}/>
                  <p>No reviews match your filters.</p>
                </td></tr>
              ) : pageData.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="table-cell-main">{r.userName}</div>
                    <div className="table-cell-sub">{r.userId}</div>
                  </td>
                  <td style={{ fontSize:13 }}>{r.partnerName}</td>
                  <td style={{ fontSize:13 }}>{r.service}</td>
                  <td><StarRating rating={r.rating} size={13}/></td>
                  <td>
                    <div style={{ maxWidth:280, fontSize:13, color:'var(--c-text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={r.comment}>
                      "{r.comment}"
                    </div>
                  </td>
                  <td style={{ fontSize:13 }}>{r.date}</td>
                  <td><Badge status={r.status}/></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-ghost btn-icon" title="View Full" onClick={() => setSelected(r)}><MessageSquare size={14}/></button>
                      {r.status !== 'visible' && (
                        <button className="btn btn-ghost btn-icon" title="Show" onClick={() => approveReview(r.id)} style={{ color:'var(--c-success)' }}><CheckCircle size={14}/></button>
                      )}
                      {r.status !== 'hidden' && (
                        <button className="btn btn-ghost btn-icon" title="Hide" onClick={() => flagReview(r.id)} style={{ color:'var(--c-warning)' }}><Flag size={14}/></button>
                      )}
                      <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => deleteReview(r.id)} style={{ color:'var(--c-danger)' }}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">Showing {Math.min((page-1)*ITEMS_PER_PAGE+1,filtered.length)}–{Math.min(page*ITEMS_PER_PAGE,filtered.length)} of {filtered.length}</span>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,idx,arr)=>(
              <React.Fragment key={p}>
                {idx>0&&arr[idx-1]!==p-1&&<span style={{padding:'0 4px',color:'var(--c-text-muted)'}}>…</span>}
                <button className={`pagination-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
              </React.Fragment>
            ))}
            <button className="pagination-btn" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}>›</button>
          </div>
        </div>
      </div>

      {/* Review Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Review Details"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            {selected?.status !== 'visible' && <button className="btn btn-success" onClick={() => { approveReview(selected.id); }}>Show Review</button>}
            {selected?.status !== 'hidden'  && <button className="btn btn-outline" style={{ color:'var(--c-warning)' }} onClick={() => { flagReview(selected.id); }}>Hide Review</button>}
            <button className="btn btn-danger" onClick={() => { deleteReview(selected.id); setSelected(null); }}>Delete</button>
          </>
        }
      >
        {selected && (
          <div>
            <div className="form-grid form-grid-2" style={{ gap:12, marginBottom:20 }}>
              <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--c-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Customer</div>
                <div style={{ fontWeight:600 }}>{selected.userName}</div>
                <div style={{ fontSize:13, color:'var(--c-text-secondary)' }}>{selected.userId}</div>
              </div>
              <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--c-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Partner</div>
                <div style={{ fontWeight:600 }}>{selected.partnerName}</div>
                <div style={{ fontSize:13, color:'var(--c-text-secondary)' }}>{selected.service}</div>
              </div>
            </div>
            <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
              <StarRating rating={selected.rating} size={18}/>
              <Badge status={selected.status}/>
              <span style={{ fontSize:13, color:'var(--c-text-secondary)' }}>{selected.date}</span>
            </div>
            <div style={{ background:'var(--c-border-light)', borderRadius:'var(--r-md)', padding:16, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <MessageSquare size={18} style={{ color:'var(--c-brand-primary)', marginTop:2, flexShrink:0 }}/>
                <p style={{ fontSize:15, lineHeight:1.6, color:'var(--c-text-primary)', fontStyle:'italic' }}>"{selected.comment}"</p>
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--c-text-secondary)', display:'flex', gap:4 }}>
              Booking reference: <strong>{selected.bookingId}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
