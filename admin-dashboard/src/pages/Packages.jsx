import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, Package, Search, MapPin, GripVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import Modal from '../components/common/Modal';
import RevenueSplitFields from '../components/common/RevenueSplitFields';
import ImageUploader from '../components/common/ImageUploader';
import ServiceTree from '../components/common/ServiceTree';
import ReorderableServiceList from '../components/common/ReorderableServiceList';
import api from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const emptyForm = () => ({
  title: '',
  description: '',
  image: '',
  price: '',
  originalPrice: '',
  serviceCount: '',
  filterCategoryId: '',   // restrict which category the user picks from
  isActive: true,
  showOnHome: false,
  validFrom: '',
  validTill: '',
  adminPercent: 20,
  partnerPercent: 80,
  gstPercent: 5,
});

// ── City multi-select pill component ─────────────────────────────────────────
function CityMultiSelect({ cities, selected, onChange }) {
  return (
    <div>
      <label className="form-label">
        Locations <span style={{ fontWeight: 400, color: 'var(--c-text-muted)' }}>(none = all cities)</span>
      </label>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
        border: '1px solid var(--c-border)', borderRadius: 8, padding: '10px 12px',
        minHeight: 44, background: '#fff',
      }}>
        {cities.map(c => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(on ? selected.filter(x => x !== c.id) : [...selected, c.id])}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `1.5px solid ${on ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                background: on ? 'var(--c-brand-primary)' : '#fff',
                color: on ? '#fff' : 'var(--c-text)',
                fontWeight: on ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              <MapPin size={11} />
              {c.name}
            </button>
          );
        })}
        {cities.length === 0 && (
          <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Loading cities…</span>
        )}
      </div>
      {selected.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--c-brand-primary)', marginTop: 5 }}>
          Available in: {selected.map(id => cities.find(c => c.id === id)?.name ?? id).join(', ')}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Packages() {
  const { showToast } = useAuth();
  const { cityParam } = useCityFilter();
  const [packages, setPackages]     = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [svcSearch, setSvcSearch]   = useState('');
  const [modal, setModal]           = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [selectedCityIds, setSelectedCityIds] = useState([]);   // multi-location
  const [selectedServiceIds, setSelectedServiceIds] = useState([]); // eligible pool to pick N from
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    api.get('/api/v1/admin/services', { params: { limit: 500 } })
      .then(r => setAllServices(r.data?.data?.data ?? r.data?.data ?? []))
      .catch(() => {});
    api.get('/api/v1/admin/services/categories')
      .then(r => setCategories(r.data?.data ?? []))
      .catch(() => {});
    api.get('/api/v1/admin/cities')
      .then(r => setCities(r.data?.data ?? []))
      .catch(() => {});
  }, []);

  // Custom packages share the same `/packages` API + table as combos (packageType:
  // 'flexible' vs 'fixed') — filtered client-side so each admin module only ever
  // shows/creates its own type.
  const fetchPackages = (silent = false) => {
    if (!silent) setLoading(true);
    const params = { limit: 500, ...(cityParam ? { cityIds: cityParam } : {}) };
    api.get('/api/v1/admin/packages', { params })
      .then(r => setPackages((r.data?.data ?? []).filter(p => p.packageType === 'flexible')))
      .catch(() => showToast('Failed to load packages', 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPackages(); }, [cityParam]);
  useAutoRefresh(() => fetchPackages(true));

  const pickerServices = useMemo(() => {
    let svcs = allServices.filter(s => s.isActive !== false);
    if (form.filterCategoryId) {
      svcs = svcs.filter(s => Number(s.categoryId) === Number(form.filterCategoryId));
    }
    if (svcSearch) {
      svcs = svcs.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase()));
    }
    return svcs;
  }, [allServices, form.filterCategoryId, svcSearch]);

  // Selected services in selection/drag order (not catalog order) — this is
  // what actually gets saved and shown to customers.
  const orderedSelectedServices = selectedServiceIds
    .map(id => allServices.find(s => Number(s.id) === id))
    .filter(Boolean);

  const toggleService = (id) => {
    const n = Number(id);
    setSelectedServiceIds(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setSelectedCityIds([]);
    setSelectedServiceIds([]);
    setSvcSearch('');
    setModal(true);
  };

  const openEdit = (pkg) => {
    setEditTarget(pkg);
    setSelectedCityIds((pkg.cityIds ?? []).map(Number));
    setSelectedServiceIds((pkg.services ?? []).map(s => Number(s.serviceId ?? s.id)).filter(Boolean));
    setSvcSearch('');
    setForm({
      title:          pkg.title ?? '',
      description:    pkg.description ?? '',
      image:          pkg.image ?? '',
      price:          pkg.price ? String(pkg.price) : '',
      originalPrice:  pkg.originalPrice ? String(pkg.originalPrice) : '',
      serviceCount:   pkg.serviceCount ? String(pkg.serviceCount) : '',
      filterCategoryId: pkg.categoryId ? String(pkg.categoryId) : '',
      isActive:       pkg.isActive ?? true,
      showOnHome:     pkg.showOnHome ?? false,
      validFrom:      pkg.validFrom ? pkg.validFrom.slice(0, 10) : '',
      validTill:      pkg.validTill ? pkg.validTill.slice(0, 10) : '',
      adminPercent:   parseFloat(pkg.adminPercent ?? 20),
      partnerPercent: parseFloat(pkg.partnerPercent ?? 80),
      gstPercent:     parseFloat(pkg.gstPercent ?? 5),
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'warning');
    if (!form.price || isNaN(parseFloat(form.price))) return showToast('Package price is required', 'warning');
    if (!form.serviceCount) return showToast('Service count is required', 'warning');

    const selectedSvcs = selectedServiceIds.map(id => allServices.find(s => Number(s.id) === id)).filter(Boolean);
    const payload = {
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      image:         form.image.trim() || null,
      packageType:   'flexible',
      price:         parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      isActive:      form.isActive,
      showOnHome:    form.showOnHome,
      cityIds:       selectedCityIds,
      validFrom:     form.validFrom || null,
      validTill:     form.validTill || null,
      services: selectedSvcs.map(s => ({
        serviceId: Number(s.id),
        name: s.name,
        price: parseFloat(s.basePrice ?? 0),
        duration: s.duration ?? null,
        image: s.image ?? null,
      })),
      serviceCount: Number(form.serviceCount),
      categoryId:   form.filterCategoryId ? Number(form.filterCategoryId) : null,
      adminPercent:   parseFloat(form.adminPercent ?? 20),
      partnerPercent: parseFloat(form.partnerPercent ?? 80),
      gstPercent:     parseFloat(form.gstPercent ?? 5),
    };

    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/api/v1/admin/packages/${editTarget.id}`, payload);
        showToast('Package updated', 'success');
      } else {
        await api.post('/api/v1/admin/packages', payload);
        showToast('Package created', 'success');
      }
      setModal(false);
      fetchPackages();
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to save package', 'danger');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/v1/admin/packages/${deleteTarget.id}`);
      setPackages(prev => prev.filter(p => p.id !== deleteTarget.id));
      showToast('Package deleted', 'success');
    } catch {
      showToast('Failed to delete package', 'danger');
    }
    setDeleteTarget(null);
  };

  const toggleActive = async (pkg) => {
    try {
      await api.put(`/api/v1/admin/packages/${pkg.id}`, { ...pkg, isActive: !pkg.isActive });
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, isActive: !p.isActive } : p));
    } catch {
      showToast('Failed to update package', 'danger');
    }
  };

  const filtered = packages.filter(p =>
    !search || (p.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Drag-reorder only makes sense against the full, unfiltered order — search
  // narrows what's shown but dropped items are re-inserted by full-list index.
  const handleDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reorderedScoped = Array.from(filtered);
    const [moved] = reorderedScoped.splice(result.source.index, 1);
    reorderedScoped.splice(result.destination.index, 0, moved);

    const scopedIds = new Set(filtered.map(p => p.id));
    let i = 0;
    setPackages(packages.map(p => (scopedIds.has(p.id) ? reorderedScoped[i++] : p)));

    try {
      await api.patch('/api/v1/packages/admin/reorder', {
        packageType: 'flexible',
        order: reorderedScoped.map(p => p.id),
      });
    } catch {
      showToast('Failed to save package order.', 'danger');
      fetchPackages();
    }
  };

  const cityLabel = (pkg) => {
    const ids = pkg.cityIds ?? [];
    if (ids.length === 0) return 'All Cities';
    return ids.map(id => cities.find(c => c.id === Number(id))?.name ?? `#${id}`).join(', ');
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Custom Packages</h1>
          <p className="page-subtitle">Let customers pick any N services from the catalog at a special price</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openCreate}>
          <Plus size={15} /> New Package
        </button>
      </div>

      {/* ── List ── */}
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search packages…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            {filtered.length} package{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Package size={36} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>No packages yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="form-hint" style={{ margin: '4px 0 8px' }}>Drag <GripVertical size={11} style={{ verticalAlign: -2 }} /> to reorder — this sets the display order on the website and app.</div>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Package</th>
                  <th>Locations</th>
                  <th>Services</th>
                  <th>Price</th>
                  <th>Valid Till</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="packages-reorder-list">
                  {(dropProvided) => (
                    <tbody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {filtered.map((pkg, index) => {
                        const savings = pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price)
                          ? Math.round(Number(pkg.originalPrice) - Number(pkg.price)) : null;
                        return (
                          <Draggable key={pkg.id} draggableId={String(pkg.id)} index={index}>
                            {(dragProvided, dragSnapshot) => (
                            <tr ref={dragProvided.innerRef} {...dragProvided.draggableProps} style={{ background: dragSnapshot.isDragging ? 'var(--c-border-light)' : undefined, ...dragProvided.draggableProps.style }}>
                              <td {...dragProvided.dragHandleProps} style={{ cursor: 'grab', color: 'var(--c-text-muted)', width: 24 }} title="Drag to reorder">
                                <GripVertical size={16} />
                              </td>
                              <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {pkg.image && <img src={pkg.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                          <div>
                            <div className="table-cell-main" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {pkg.title}
                              {pkg.showOnHome && (
                                <span title="Featured on home screen" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-brand-primary)', background: 'rgba(6,64,129,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                                  HOME
                                </span>
                              )}
                            </div>
                            {pkg.description && <div className="table-cell-sub" style={{ maxWidth: 200 }}>{pkg.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} style={{ color: 'var(--c-text-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12 }}>{cityLabel(pkg)}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>Any {pkg.serviceCount ?? 1}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-brand-primary)' }}>₹{fmt(pkg.price)}</div>
                        {savings && <div style={{ fontSize: 11, color: '#16a34a' }}>Save ₹{fmt(savings)}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          {pkg.validTill ? new Date(pkg.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox" checked={pkg.isActive} onChange={() => toggleActive(pkg)} />
                          <span style={{ fontSize: 12, color: pkg.isActive ? '#16a34a' : 'var(--c-text-muted)' }}>
                            {pkg.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(pkg)}><Edit2 size={14} /></button>
                          <button className="btn btn-ghost btn-icon" title="Delete" style={{ color: 'var(--c-danger)' }} onClick={() => setDeleteTarget(pkg)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                            </tr>
                            )}
                          </Draggable>
                        );
                      })}
                      {dropProvided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </DragDropContext>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editTarget ? 'Edit Package' : 'New Package'}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Package'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title & Description */}
          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="e.g. Party Combo" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Short description shown to users" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          {/* Banner Image */}
          <div>
            <label className="form-label">Banner Image</label>
            <ImageUploader value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} width={140} height={74} />
          </div>

          {/* ── Locations (multi-select pills) ── */}
          <CityMultiSelect cities={cities} selected={selectedCityIds} onChange={setSelectedCityIds} />

          {/* Price + Original Price */}
          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Package Price (₹) *</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 999" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Original Price (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 1499" value={form.originalPrice}
                onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
            </div>
          </div>

          {/* Validity + Active */}
          <div className="form-grid form-grid-3" style={{ gap: 12, alignItems: 'end' }}>
            <div>
              <label className="form-label">Valid From</label>
              <input className="form-input" type="date" value={form.validFrom}
                onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Valid Till</label>
              <input className="form-input" type="date" value={form.validTill}
                onChange={e => setForm(f => ({ ...f, validTill: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 2 }}>
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span style={{ fontSize: 13 }}>Active</span>
            </label>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: form.showOnHome ? 'rgba(6,64,129,0.06)' : 'var(--c-border-light)',
            border: `1px solid ${form.showOnHome ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
            borderRadius: 8, padding: '10px 12px',
          }}>
            <input type="checkbox" checked={form.showOnHome}
              onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Show on Home Screen</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Feature this package in the app's home screen header carousel</div>
            </div>
          </label>

          <RevenueSplitFields form={form} setForm={setForm} />

          {/* ── Pick-N settings ── */}
          <div style={{ background: 'var(--c-border-light)', borderRadius: 8, padding: '12px 14px' }}>
            <label className="form-label" style={{ marginBottom: 10 }}>Pick-N Settings</label>
            <div className="form-grid form-grid-2" style={{ gap: 12 }}>
              <div>
                <label className="form-label">Number of Services User Picks *</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 3" value={form.serviceCount}
                  onChange={e => setForm(f => ({ ...f, serviceCount: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">
                  Restrict to Category <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <select className="form-input" value={form.filterCategoryId}
                  onChange={e => setForm(f => ({ ...f, filterCategoryId: e.target.value }))}>
                  <option value="">Any Category</option>
                  {categories.map(c => <option key={c.id ?? c._id} value={c.id ?? c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Eligible services pool ── */}
          <div style={{ background: 'var(--c-border-light)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Eligible Services <span style={{ fontWeight: 400, color: 'var(--c-text-muted)' }}>(empty = entire catalog)</span>
                {selectedServiceIds.length > 0 && (
                  <span style={{ fontWeight: 400, color: 'var(--c-brand-primary)', marginLeft: 8 }}>
                    {selectedServiceIds.length} selected
                  </span>
                )}
              </label>
              {selectedServiceIds.length > 0 && (
                <button type="button" style={{ fontSize: 12, color: 'var(--c-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setSelectedServiceIds([])}>
                  Clear all
                </button>
              )}
            </div>
            <input
              className="form-input"
              placeholder="Search services…"
              value={svcSearch}
              onChange={e => setSvcSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <ServiceTree
              categories={categories}
              services={pickerServices}
              selectedIds={selectedServiceIds}
              onToggle={toggleService}
            />
            {orderedSelectedServices.length > 1 && (
              <div style={{ marginTop: 12 }}>
                <ReorderableServiceList
                  services={orderedSelectedServices}
                  onReorder={setSelectedServiceIds}
                  onRemove={toggleService}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Package"
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
