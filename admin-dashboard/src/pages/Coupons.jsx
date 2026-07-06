import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Tag, CheckCircle, Clock, XCircle, Search, Gift, MapPin } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { useCoupons, useReferral } from '../hooks/useCoupons';

const couponStatus = (c) => {
  const now = new Date();
  if (!c.isActive) return 'expired';
  if (c.validFrom && new Date(c.validFrom) > now) return 'scheduled';
  if (c.validTill && new Date(c.validTill) < now) return 'expired';
  return 'active';
};

const normalizeCoupon = c => ({
  ...c,
  id: String(c._id ?? c.id ?? ''),
  type: c.type === 'percent' ? 'percentage' : (c.type ?? 'flat'),
  discount: c.discount ?? 0,
  maxDiscount: c.maxDiscount ?? '',
  minOrder: c.minOrderAmount ?? c.minOrder ?? 0,
  usageLimit: c.maxUses ?? c.usageLimit ?? 9999,
  usedCount: c.usedCount ?? 0,
  expiryDate: ((c.validTill ?? c.expiryDate) ? (c.validTill ?? c.expiryDate).slice(0, 10) : ''),
  description: c.description ?? '',
  cityIds: c.cityIds ?? [],
  status: couponStatus(c),
});

const FormFields = ({ form, setForm, cities = [] }) => {
  const selectedCityIds = form.cityIds ?? [];
  const toggleCity = (id) => {
    setForm(f => ({
      ...f,
      cityIds: selectedCityIds.includes(id)
        ? selectedCityIds.filter(x => x !== id)
        : [...selectedCityIds, id],
    }));
  };

  return (
    <div className="form-grid">
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Coupon Code *</label>
          <input className="form-input" style={{ textTransform:'uppercase', fontFamily:'monospace', fontWeight:700 }} placeholder="SAVE20" value={form.code||''} onChange={e => setForm(f=>({...f,code:e.target.value.toUpperCase()}))} />
        </div>
        <div className="form-group">
          <label className="form-label">Discount Type *</label>
          <select className="form-select" value={form.type||'percentage'} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
            <option value="percentage">Percentage (%)</option>
            <option value="flat">Flat Amount (₹)</option>
          </select>
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Discount Value *</label>
          <input className="form-input" type="number" placeholder={form.type==='flat'?'150':'20'} value={form.discount||''} onChange={e => setForm(f=>({...f,discount:e.target.value}))} />
          <span className="form-hint">{form.type==='flat' ? 'Amount in ₹' : 'Percentage (1–100)'}</span>
        </div>
        <div className="form-group">
          <label className="form-label">Minimum Order (₹)</label>
          <input className="form-input" type="number" placeholder="500" value={form.minOrder||''} onChange={e => setForm(f=>({...f,minOrder:e.target.value}))} />
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="date" value={form.startDate||''} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} />
          <span className="form-hint">Leave blank to activate immediately. Set a future date to schedule.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Expiry Date</label>
          <input className="form-input" type="date" value={form.expiryDate||''} onChange={e => setForm(f=>({...f,expiryDate:e.target.value}))} />
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Max Uses</label>
          <input className="form-input" type="number" placeholder="Unlimited" value={form.usageLimit||''} onChange={e => setForm(f=>({...f,usageLimit:e.target.value}))} />
          <span className="form-hint">Total times this coupon can be used across all customers. Leave blank for unlimited.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Max Discount Amount (₹)</label>
          <input className="form-input" type="number" placeholder="e.g. 200" value={form.maxDiscount||''} onChange={e => setForm(f=>({...f,maxDiscount:e.target.value}))} />
          <span className="form-hint">Cap the discount at this amount. E.g. 20% on ₹2000 = ₹400 but capped at ₹200.</span>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <input className="form-input" placeholder="e.g. New user welcome discount" value={form.description||''} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
      </div>
      <div className="form-group">
        <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>
          <MapPin size={14}/> Available Locations
        </label>
        {cities.length === 0 ? (
          <span className="form-hint">No cities configured. Coupon will apply to all cities.</span>
        ) : (
          <>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:6 }}>
              {cities.map(city => {
                const active = selectedCityIds.includes(city.id);
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => toggleCity(city.id)}
                    style={{
                      padding:'5px 12px',
                      borderRadius:'var(--r-full)',
                      border:`1.5px solid ${active ? 'var(--c-brand-teal-mid)' : 'var(--c-border)'}`,
                      background: active ? 'var(--c-brand-teal-mid)' : 'transparent',
                      color: active ? '#fff' : 'var(--c-text-secondary)',
                      fontSize:12, fontWeight: active ? 600 : 400,
                      cursor:'pointer', transition:'all 0.15s',
                    }}>
                    {city.name}
                  </button>
                );
              })}
            </div>
            <span className="form-hint" style={{ marginTop:6 }}>
              {selectedCityIds.length === 0
                ? 'No cities selected — coupon is available in all cities.'
                : `Available in ${selectedCityIds.length} selected ${selectedCityIds.length === 1 ? 'city' : 'cities'} only.`}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default function Coupons() {
  const { showToast } = useAuth();
  const { fetchList, create, update, remove } = useCoupons();
  const { fetchList: fetchReferral, action: refAction } = useReferral();
  const { cities } = useCityFilter();
  const [coupons, setCoupons]         = useState([]);
  const [search, setSearch]           = useState('');
  const [statusFilter, setSF]         = useState('all');
  const [editing, setEditing]         = useState(null);
  const [adding, setAdding]           = useState(false);
  const [form, setForm]               = useState({});
  const [managingRef, setManagingRef] = useState(false);
  const [refForm, setRefForm]         = useState({ rewardAmount: 100, minOrder: 400, maxReferrals: 9999, active: true });

  useEffect(() => {
    fetchList().then(res => { if (res.ok) setCoupons((res.data?.data ?? []).map(normalizeCoupon)); });
    fetchReferral().then(res => { if (res.ok && res.data?.data) setRefForm(res.data.data); });
  }, []);

  const filtered = coupons.filter(c =>
    (!search || c.code.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
    && (statusFilter === 'all' || c.status === statusFilter)
  );

  const stats = {
    total:    coupons.length,
    active:   coupons.filter(c => c.status==='active').length,
    expired:  coupons.filter(c => c.status==='expired').length,
    scheduled:coupons.filter(c => c.status==='scheduled').length,
    totalUsed:coupons.reduce((a,c) => a+(c.usedCount??0), 0),
  };

  const deleteCoupon = async (id) => {
    const res = await remove(id);
    if (res.ok) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      showToast('Coupon deleted.', 'danger');
    } else {
      showToast(res.error ?? 'Failed to delete coupon.', 'danger');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    showToast(`Copied "${code}" to clipboard!`, 'success');
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      ...c,
      startDate: c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 10) : '',
      cityIds: c.cityIds ?? [],
    });
  };

  const saveEdit = async () => {
    const payload = {
      code: form.code,
      type: form.type === 'percentage' ? 'percent' : (form.type || 'flat'),
      discount: +form.discount,
      minOrderAmount: +form.minOrder || 0,
      ...(form.maxDiscount ? {maxDiscount: +form.maxDiscount} : {maxDiscount: null}),
      ...(form.usageLimit ? {maxUses: +form.usageLimit} : {}),
      ...(form.startDate ? {validFrom: new Date(form.startDate).toISOString()} : {}),
      ...(form.expiryDate ? {validTill: form.expiryDate} : {}),
      description: form.description || '',
      cityIds: form.cityIds ?? [],
    };
    const res = await update(editing.id, payload);
    if (res.ok) {
      setCoupons(prev => prev.map(c => c.id === editing.id ? normalizeCoupon({...c, ...payload, id: editing.id}) : c));
      showToast('Coupon updated!', 'success');
      setEditing(null);
    } else {
      showToast(res.error ?? 'Failed to update coupon.', 'danger');
    }
  };

  const saveNew = async () => {
    if (!form.code || !form.discount) { showToast('Please fill required fields.', 'danger'); return; }
    const payload = {
      code: form.code,
      type: form.type === 'percentage' ? 'percent' : (form.type || 'flat'),
      discount: +form.discount,
      minOrderAmount: +form.minOrder || 0,
      ...(form.maxDiscount ? {maxDiscount: +form.maxDiscount} : {}),
      ...(form.usageLimit ? {maxUses: +form.usageLimit} : {}),
      validFrom: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
      ...(form.expiryDate ? {validTill: form.expiryDate} : {}),
      description: form.description || '',
      isActive: true,
      cityIds: form.cityIds ?? [],
    };
    const res = await create(payload);
    if (res.ok) {
      setCoupons(prev => [...prev, normalizeCoupon(res.data?.data ?? payload)]);
      showToast('Coupon created!', 'success');
      setAdding(false);
    } else {
      showToast(res.error ?? 'Failed to create coupon.', 'danger');
    }
  };

  const statusIcon = { active:<CheckCircle size={14} style={{color:'var(--c-success)'}}/>, expired:<XCircle size={14} style={{color:'var(--c-danger)'}}/>, scheduled:<Clock size={14} style={{color:'var(--c-warning)'}}/>};

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid stats-grid-5" style={{ marginBottom:24 }}>
        {[
          { label:'Total Coupons', value:stats.total,      color:'#064081' },
          { label:'Active',        value:stats.active,     color:'#22C55E' },
          { label:'Scheduled',     value:stats.scheduled,  color:'#F59E0B' },
          { label:'Expired',       value:stats.expired,    color:'#EF4444' },
          { label:'Total Used',    value:stats.totalUsed,  color:'#02B0E8' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Referral Banner */}
      <div style={{ background:'linear-gradient(135deg,var(--c-brand-teal-mid),var(--c-brand-teal-dark))', borderRadius:'var(--r-lg)', padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, color:'white' }}>
          <div style={{ background:'rgba(253,215,122,0.2)', borderRadius:'var(--r-md)', width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Gift size={24} style={{ color:'#FDD77A' }}/>
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Referral Program Active</div>
            <div style={{ opacity:0.8, fontSize:13, marginTop:2 }}>456 referrals used this month · ₹100 reward per referral (REFER100)</div>
          </div>
        </div>
        <button className="btn btn-outline" style={{ color:'white', borderColor:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.1)' }} onClick={() => setManagingRef(true)}>Manage Program</button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16}/>
            <input className="search-input" placeholder="Search coupon code or description…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setSF(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setForm({ type:'percentage', applicable:'all', cityIds:[] }); }} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={14}/> Create Coupon
          </button>
        </div>

        <div className="form-grid form-grid-2" style={{ padding:20 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ border:'1px solid var(--c-border)', borderRadius:'var(--r-lg)', overflow:'hidden', opacity:c.status==='expired'?0.65:1 }}>
              <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--c-border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ background:c.status==='active'?'var(--c-success-bg)':c.status==='scheduled'?'var(--c-warning-bg)':'var(--c-border-light)', borderRadius:'var(--r-md)', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Tag size={18} style={{ color:c.status==='active'?'var(--c-success)':c.status==='scheduled'?'var(--c-warning)':'var(--c-text-muted)' }}/>
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:16, letterSpacing:1 }}>{c.code}</span>
                      <button onClick={() => copyCode(c.code)} style={{ color:'var(--c-text-muted)', padding:2 }} title="Copy code"><Copy size={13}/></button>
                    </div>
                    <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginTop:1 }}>{c.description}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {statusIcon[c.status]}
                  <Badge status={c.status}/>
                </div>
              </div>

              <div className="form-grid form-grid-4" style={{ padding:'14px 20px', gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--c-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Discount</div>
                  <div style={{ fontWeight:800, fontSize:18, color:'var(--c-brand-orange)' }}>
                    {c.type==='percentage' ? `${c.discount}%` : `₹${c.discount}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--c-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Min Order</div>
                  <div style={{ fontWeight:600 }}>₹{c.minOrder}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--c-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Used / Limit</div>
                  <div style={{ fontWeight:600 }}>{c.usedCount} / {c.usageLimit === 9999 ? '∞' : c.usageLimit}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--c-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Expires</div>
                  <div style={{ fontWeight:500, fontSize:13 }}>{new Date(c.expiryDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
                </div>
              </div>

              {/* Location chips */}
              {Array.isArray(c.cityIds) && c.cityIds.length > 0 && (
                <div style={{ padding:'0 20px 12px', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                  <MapPin size={12} style={{ color:'var(--c-text-secondary)', flexShrink:0 }}/>
                  {c.cityIds.map(cid => {
                    const city = cities.find(x => x.id === cid);
                    return city ? (
                      <span key={cid} style={{ fontSize:11, background:'var(--c-brand-teal-bg,#EAF5F0)', color:'var(--c-brand-teal-mid)', borderRadius:'var(--r-full)', padding:'2px 8px', fontWeight:500 }}>{city.name}</span>
                    ) : null;
                  })}
                </div>
              )}
              {(!c.cityIds || c.cityIds.length === 0) && (
                <div style={{ padding:'0 20px 12px', display:'flex', alignItems:'center', gap:5 }}>
                  <MapPin size={12} style={{ color:'var(--c-text-secondary)' }}/>
                  <span style={{ fontSize:11, color:'var(--c-text-secondary)' }}>All cities</span>
                </div>
              )}

              {/* Usage progress bar */}
              {c.usageLimit !== 9999 && (
                <div style={{ padding:'0 20px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--c-text-secondary)', marginBottom:4 }}>
                    <span>Usage</span>
                    <span>{Math.round(c.usedCount/c.usageLimit*100)}%</span>
                  </div>
                  <div style={{ background:'var(--c-border)', borderRadius:'var(--r-full)', height:6 }}>
                    <div style={{ height:'100%', borderRadius:'var(--r-full)', background:`linear-gradient(90deg,var(--c-brand-teal-mid),var(--c-brand-secondary))`, width:`${Math.min(c.usedCount/c.usageLimit*100,100)}%` }}/>
                  </div>
                </div>
              )}

              <div style={{ padding:'12px 20px', borderTop:'1px solid var(--c-border)', display:'flex', gap:8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)} style={{ flex:1, justifyContent:'center' }}><Edit2 size={13}/> Edit</button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteCoupon(c.id)} style={{ color:'var(--c-danger)', justifyContent:'center' }}><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit Coupon — ${editing?.code}`} footer={<><button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save Changes</button></>}>
        {editing && <FormFields form={form} setForm={setForm} cities={cities}/>}
      </Modal>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Create New Coupon" footer={<><button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={saveNew}>Create Coupon</button></>}>
        <FormFields form={form} setForm={setForm} cities={cities}/>
      </Modal>

      <Modal isOpen={managingRef} onClose={() => setManagingRef(false)} title="Manage Referral Program" size="sm"
        footer={<><button className="btn btn-outline" onClick={() => setManagingRef(false)}>Cancel</button><button className="btn btn-teal" onClick={() => { refAction('put', '/api/v1/admin/referral', refForm).then(res => { if (res.ok) { showToast('Referral program updated!','success'); setManagingRef(false); } else showToast(res.error ?? 'Failed to update referral.', 'danger'); }); }}>Save Changes</button></>}
      >
        <div className="form-grid">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--c-border)' }}>
            <div>
              <div style={{ fontWeight:600 }}>Program Status</div>
              <div style={{ fontSize:12, color:'var(--c-text-secondary)', marginTop:2 }}>Enable or disable the referral program</div>
            </div>
            <label className="toggle-switch"><input type="checkbox" checked={refForm.active} onChange={e => setRefForm(f=>({...f,active:e.target.checked}))}/><span className="toggle-slider"/></label>
          </div>
          <div className="form-group">
            <label className="form-label">Reward Amount (₹ per referral)</label>
            <input className="form-input" type="number" value={refForm.rewardAmount} onChange={e => setRefForm(f=>({...f,rewardAmount:+e.target.value}))}/>
            <span className="form-hint">Given as coupon credit to the referrer</span>
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Order to Redeem (₹)</label>
            <input className="form-input" type="number" value={refForm.minOrder} onChange={e => setRefForm(f=>({...f,minOrder:+e.target.value}))}/>
          </div>
          <div className="form-group">
            <label className="form-label">Max Referrals per User</label>
            <input className="form-input" type="number" value={refForm.maxReferrals === 9999 ? '' : refForm.maxReferrals} placeholder="Unlimited" onChange={e => setRefForm(f=>({...f,maxReferrals:e.target.value?+e.target.value:9999}))}/>
            <span className="form-hint">Leave blank for unlimited</span>
          </div>
          <div style={{ background:'var(--c-info-bg)', borderRadius:'var(--r-md)', padding:'12px 14px', fontSize:13, color:'var(--c-info-text)' }}>
            <strong>Current Stats:</strong> 456 referrals used · ₹{456 * refForm.rewardAmount} total rewarded this month
          </div>
        </div>
      </Modal>
    </div>
  );
}
