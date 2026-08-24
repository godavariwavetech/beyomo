import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Gift, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import RevenueSplitFields, { revenueSplitPayload } from '../components/common/RevenueSplitFields';
import ImageUploader from '../components/common/ImageUploader';
import api from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const TRIGGER_LABELS = {
  min_spend:          'Minimum Spend',
  specific_services:  'Specific Services',
  min_count:          'Service Count',
  category:           'Category Count',
};

const TRIGGER_DESCRIPTIONS = {
  min_spend:         'User spends ≥ ₹X in a single booking',
  specific_services: 'User must include ALL selected services in their booking',
  min_count:         'User books ≥ N services in total',
  category:          'User books ≥ N services from the same category',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const emptyForm = () => ({
  title: '', description: '', image: '',
  triggerType: 'min_spend',
  triggerValue: { amount: '' },
  freeServiceId: '',
  validFrom: '', validTill: '',
  isActive: true,
  cityId: '', maxUses: '',
  adminPercent: 20,
  partnerPercent: 80,
  gstPercent: 5,
});

export default function Offers() {
  const { showToast } = useAuth();
  const { cityParam } = useCityFilter();
  const [offers, setOffers]           = useState([]);
  const [services, setServices]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [cities, setCities]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [svcSearch, setSvcSearch]     = useState('');
  // Dedicated state for service multi-select — avoids nested-form stale-closure bugs
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]           = useState(emptyForm());
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/api/v1/admin/services', { params: { limit: 500 } })
      .then(r => setServices(r.data?.data?.data ?? r.data?.data ?? []))
      .catch(() => {});
    api.get('/api/v1/admin/categories')
      .then(r => setCategories(r.data?.data ?? []))
      .catch(() => {});
    api.get('/api/v1/admin/cities')
      .then(r => setCities(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  const fetchOffers = (silent = false) => {
    if (!silent) setLoading(true);
    const params = cityParam ? { cityIds: cityParam } : {};
    api.get('/api/v1/admin/offers', { params })
      .then(r => setOffers(r.data?.data?.data ?? r.data?.data ?? []))
      .catch(() => showToast('Failed to load offers', 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOffers(); }, [cityParam]);
  useAutoRefresh(() => fetchOffers(true));

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setSelectedServiceIds([]);
    setSvcSearch('');
    setModal(true);
  };

  const openEdit = (offer) => {
    setEditTarget(offer);
    setSvcSearch('');
    const rawTv = offer.triggerValue ?? {};
    const tv = typeof rawTv === 'string' ? (() => { try { return JSON.parse(rawTv); } catch { return {}; } })() : rawTv;
    setSelectedServiceIds((tv.serviceIds ?? []).map(Number));
    setForm({
      title: offer.title ?? '',
      description: offer.description ?? '',
      image: offer.image ?? '',
      triggerType: offer.triggerType,
      triggerValue: tv,   // already parsed above
      freeServiceId: String(offer.freeServiceId ?? ''),
      validFrom: offer.validFrom ? offer.validFrom.slice(0, 10) : '',
      validTill: offer.validTill ? offer.validTill.slice(0, 10) : '',
      isActive: offer.isActive ?? true,
      cityId: offer.cityId ? String(offer.cityId) : '',
      maxUses: offer.maxUses ? String(offer.maxUses) : '',
      adminPercent: parseFloat(offer.adminPercent ?? 20),
      partnerPercent: parseFloat(offer.partnerPercent ?? 80),
      gstPercent: parseFloat(offer.gstPercent ?? 5),
    });
    setModal(true);
  };

  const buildTriggerValue = () => {
    const { triggerType, triggerValue: tv } = form;
    if (triggerType === 'min_spend')         return { amount: Number(tv.amount ?? 0) };
    if (triggerType === 'specific_services') return { serviceIds: selectedServiceIds };
    if (triggerType === 'min_count')         return { count: Number(tv.count ?? 1) };
    if (triggerType === 'category')          return { categoryId: Number(tv.categoryId ?? 0), count: Number(tv.count ?? 1) };
    return {};
  };

  const handleSave = async () => {
    if (!form.title.trim())       return showToast('Title is required', 'warning');
    if (!form.freeServiceId)      return showToast('Free service is required', 'warning');
    if (!form.validFrom || !form.validTill) return showToast('Validity dates are required', 'warning');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        image: form.image?.trim() || null,
        triggerType: form.triggerType,
        triggerValue: buildTriggerValue(),
        freeServiceId: Number(form.freeServiceId),
        validFrom: form.validFrom,
        validTill: form.validTill,
        isActive: form.isActive,
        cityId: form.cityId ? Number(form.cityId) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        ...revenueSplitPayload(form),
      };
      if (editTarget) {
        await api.patch(`/api/v1/admin/offers/${editTarget.id}`, payload);
        showToast('Offer updated', 'success');
      } else {
        await api.post('/api/v1/admin/offers', payload);
        showToast('Offer created', 'success');
      }
      setModal(false);
      fetchOffers();
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to save offer', 'danger');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/v1/admin/offers/${deleteTarget.id}`);
      setOffers(prev => prev.filter(o => o.id !== deleteTarget.id));
      showToast('Offer deleted', 'success');
    } catch {
      showToast('Failed to delete offer', 'danger');
    }
    setDeleteTarget(null);
  };

  const toggleActive = async (offer) => {
    try {
      await api.patch(`/api/v1/admin/offers/${offer.id}`, { isActive: !offer.isActive });
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: !o.isActive } : o));
    } catch { showToast('Failed to update offer', 'danger'); }
  };

  const setTv = (key, val) => setForm(f => ({ ...f, triggerValue: { ...f.triggerValue, [key]: val } }));

  const filtered = offers.filter(o =>
    !search || (o.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const freeServiceName = (offer) => offer.freeService?.name ?? services.find(s => s.id === offer.freeServiceId)?.name ?? `#${offer.freeServiceId}`;
  const cityName = (offer) => offer.cityId ? (cities.find(c => c.id === Number(offer.cityId))?.name ?? `City #${offer.cityId}`) : 'All Cities';

  const parseTv = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
    return raw;
  };

  const triggerSummary = (offer) => {
    const tv = parseTv(offer.triggerValue);
    if (offer.triggerType === 'min_spend') return `Spend ₹${fmt(tv.amount)}`;
    if (offer.triggerType === 'specific_services') {
      const names = (tv.serviceIds ?? [])
        .map(id => services.find(s => s.id === Number(id))?.name ?? `#${id}`)
        .join(', ');
      return names || `${(tv.serviceIds ?? []).length} service(s)`;
    }
    if (offer.triggerType === 'min_count') return `Book ${tv.count ?? 1}+ services`;
    if (offer.triggerType === 'category') {
      const cat = categories.find(c => c.id === Number(tv.categoryId));
      return `${tv.count ?? 1}+ from ${cat?.name ?? `category #${tv.categoryId}`}`;
    }
    return '—';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Book &amp; Get Free Offers</h1>
          <p className="page-subtitle">Create promotions — users who qualify get a service added for free</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openCreate}>
          <Plus size={15} /> New Offer
        </button>
      </div>

      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search offers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{filtered.length} offer{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Gift size={36} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>No offers yet. Create one to start.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Trigger</th>
                  <th>Free Service</th>
                  <th>Uses</th>
                  <th>Valid Till</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(offer => (
                  <tr key={offer.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        {offer.image && <img src={offer.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                        <div>
                          <div className="table-cell-main">{offer.title}</div>
                          <div className="table-cell-sub">{cityName(offer)}</div>
                          {offer.description && <div className="table-cell-sub" style={{ maxWidth: 180 }}>{offer.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-brand-primary)' }}>{TRIGGER_LABELS[offer.triggerType]}</div>
                      <div className="table-cell-sub">{triggerSummary(offer)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Gift size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{freeServiceName(offer)}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{offer.usedCount ?? 0}{offer.maxUses ? ` / ${offer.maxUses}` : ''}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>{offer.validTill ? new Date(offer.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                    </td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={offer.isActive} onChange={() => toggleActive(offer)} />
                        <span style={{ fontSize: 12, color: offer.isActive ? '#16a34a' : 'var(--c-text-muted)' }}>
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(offer)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-icon" title="Delete" style={{ color: 'var(--c-danger)' }} onClick={() => setDeleteTarget(offer)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editTarget ? 'Edit Offer' : 'New Offer'}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Offer'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title & Description */}
          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Summer Glow Deal" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description shown to users" />
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="form-label">Banner Image <span style={{ fontWeight: 400, color: 'var(--c-text-muted)', fontSize: 11 }}>JPG/PNG/WebP · max 2 MB · 290×200 px</span></label>
            <ImageUploader value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} width={140} height={74} exactWidth={290} exactHeight={200} />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="form-label">Trigger Type *</label>
            <select className="form-input" value={form.triggerType} onChange={e => {
              setForm(f => ({ ...f, triggerType: e.target.value, triggerValue: {} }));
              setSelectedServiceIds([]);
              setSvcSearch('');
            }}>
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <p style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{TRIGGER_DESCRIPTIONS[form.triggerType]}</p>
          </div>

          {/* Dynamic trigger value fields */}
          <div style={{ background: 'var(--c-border-light)', borderRadius: 8, padding: '12px 14px' }}>
            <label className="form-label" style={{ marginBottom: 10 }}>Trigger Conditions</label>
            {form.triggerType === 'min_spend' && (
              <div>
                <label className="form-label">Minimum Spend (₹) *</label>
                <input className="form-input" type="number" min="0" value={form.triggerValue.amount ?? ''} onChange={e => setTv('amount', e.target.value)} placeholder="e.g. 999" />
              </div>
            )}
            {form.triggerType === 'specific_services' && (
              <div>
                <label className="form-label">Required Services * (user must have ALL selected)</label>
                <input
                  className="form-input"
                  placeholder="Search services…"
                  value={svcSearch}
                  onChange={e => setSvcSearch(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--c-border)', borderRadius: 6, padding: '4px 0' }}>
                  {services
                    .filter(s => !svcSearch || s.name.toLowerCase().includes(svcSearch.toLowerCase()))
                    .map(s => {
                      const isChecked = selectedServiceIds.includes(Number(s.id));
                      return (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', cursor: 'pointer', background: isChecked ? 'var(--c-border-light)' : 'transparent' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const nid = Number(s.id);
                              setSelectedServiceIds(prev =>
                                prev.includes(nid) ? prev.filter(id => id !== nid) : [...prev, nid]
                              );
                            }}
                          />
                          <span style={{ flex: 1, fontSize: 13 }}>{s.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>₹{fmt(s.basePrice)}</span>
                        </label>
                      );
                    })}
                  {services.filter(s => !svcSearch || s.name.toLowerCase().includes(svcSearch.toLowerCase())).length === 0 && (
                    <p style={{ padding: '8px 12px', fontSize: 13, color: 'var(--c-text-muted)' }}>No services found</p>
                  )}
                </div>
                {selectedServiceIds.length > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--c-brand-primary)', marginTop: 6 }}>
                    Selected: {selectedServiceIds.map(id => services.find(s => Number(s.id) === id)?.name ?? `#${id}`).join(', ')}
                  </p>
                )}
              </div>
            )}
            {form.triggerType === 'min_count' && (
              <div>
                <label className="form-label">Minimum Number of Services *</label>
                <input className="form-input" type="number" min="1" value={form.triggerValue.count ?? ''} onChange={e => setTv('count', e.target.value)} placeholder="e.g. 2" />
              </div>
            )}
            {form.triggerType === 'category' && (
              <div className="form-grid form-grid-2" style={{ gap: 12 }}>
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={form.triggerValue.categoryId ?? ''} onChange={e => setTv('categoryId', Number(e.target.value))}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Minimum Count *</label>
                  <input className="form-input" type="number" min="1" value={form.triggerValue.count ?? ''} onChange={e => setTv('count', e.target.value)} placeholder="e.g. 2" />
                </div>
              </div>
            )}
          </div>

          {/* Free Service */}
          <div>
            <label className="form-label">Free Service *</label>
            <select className="form-input" value={form.freeServiceId} onChange={e => setForm(f => ({ ...f, freeServiceId: e.target.value }))}>
              <option value="">Select service to give free…</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — ₹{fmt(s.basePrice)}</option>)}
            </select>
          </div>

          {/* Validity */}
          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Valid From *</label>
              <input className="form-input" type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Valid Till *</label>
              <input className="form-input" type="date" value={form.validTill} onChange={e => setForm(f => ({ ...f, validTill: e.target.value }))} />
            </div>
          </div>

          {/* Optional */}
          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Max Uses (leave blank for unlimited)</label>
              <input className="form-input" type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="e.g. 100" />
            </div>
            <div>
              <label className="form-label">City (leave blank = all cities)</label>
              <select className="form-input" value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}{c.state ? `, ${c.state}` : ''}</option>)}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <span style={{ fontSize: 14 }}>Active (visible to users immediately)</span>
          </label>

          <RevenueSplitFields form={form} setForm={setForm} />
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Offer"
        size="sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ fontSize: 14 }}>
          Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
