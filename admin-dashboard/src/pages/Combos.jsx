import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, Boxes, Search, MapPin, GripVertical } from 'lucide-react';
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

// ── Amounts summary bar ───────────────────────────────────────────────────────
function AmountsSummary({ selectedIds, allServices, packagePrice }) {
  const selected = allServices.filter(s => selectedIds.includes(Number(s.id)));
  if (selected.length === 0) return null;

  const originalSum = selected.reduce((t, s) => t + parseFloat(s.basePrice ?? 0), 0);
  const pkgPrice = parseFloat(packagePrice) || 0;
  const savings = pkgPrice > 0 ? Math.max(0, originalSum - pkgPrice) : null;
  const savingsPct = savings != null && originalSum > 0 ? Math.round((savings / originalSum) * 100) : 0;

  return (
    <div style={{
      display: 'flex', gap: 0, border: '1px solid var(--c-border)', borderRadius: 8,
      overflow: 'hidden', fontSize: 13,
    }}>
      <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid var(--c-border)' }}>
        <div style={{ color: 'var(--c-text-muted)', fontSize: 11, marginBottom: 2 }}>Services selected</div>
        <div style={{ fontWeight: 700 }}>{selected.length}</div>
      </div>
      <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid var(--c-border)' }}>
        <div style={{ color: 'var(--c-text-muted)', fontSize: 11, marginBottom: 2 }}>Original value</div>
        <div style={{ fontWeight: 700 }}>₹{fmt(originalSum)}</div>
      </div>
      <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid var(--c-border)' }}>
        <div style={{ color: 'var(--c-text-muted)', fontSize: 11, marginBottom: 2 }}>Combo price</div>
        <div style={{ fontWeight: 700, color: pkgPrice > 0 ? 'var(--c-brand-primary)' : 'var(--c-text-muted)' }}>
          {pkgPrice > 0 ? `₹${fmt(pkgPrice)}` : '—'}
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px 14px' }}>
        <div style={{ color: 'var(--c-text-muted)', fontSize: 11, marginBottom: 2 }}>Customer saves</div>
        <div style={{ fontWeight: 700, color: savings > 0 ? '#16a34a' : 'var(--c-text-muted)' }}>
          {savings != null && savings > 0 ? `₹${fmt(savings)} (${savingsPct}%)` : '—'}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Combos() {
  const { showToast } = useAuth();
  const { cityParam } = useCityFilter();
  const [combos, setCombos]         = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [svcSearch, setSvcSearch]   = useState('');
  const [modal, setModal]           = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [selectedCityIds, setSelectedCityIds] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
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

  // Combos share the same `/packages` API + table as flexible custom packages
  // (packageType: 'fixed' vs 'flexible') — filtered client-side so each admin
  // module only ever shows/creates its own type.
  const fetchCombos = (silent = false) => {
    if (!silent) setLoading(true);
    const params = { limit: 500, ...(cityParam ? { cityIds: cityParam } : {}) };
    api.get('/api/v1/admin/packages', { params })
      .then(r => setCombos((r.data?.data ?? []).filter(p => p.packageType === 'fixed')))
      .catch(() => showToast('Failed to load combos', 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCombos(); }, [cityParam]);
  useAutoRefresh(() => fetchCombos(true));

  const serviceAvailableInAll = (svc, cityIds) => {
    const mapped = svc.cityIds ?? [];
    if (mapped.length === 0) return true;
    return cityIds.every(cid => mapped.includes(Number(cid)));
  };

  useEffect(() => {
    if (selectedServiceIds.length === 0) return;
    const validIds = new Set(
      allServices
        .filter(s => serviceAvailableInAll(s, selectedCityIds))
        .map(s => Number(s.id))
    );
    setSelectedServiceIds(prev => prev.filter(id => validIds.has(id)));
  }, [selectedCityIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickerServices = useMemo(() => {
    let svcs = allServices.filter(s => s.isActive !== false);
    if (selectedCityIds.length > 0) {
      svcs = svcs.filter(s => serviceAvailableInAll(s, selectedCityIds));
    }
    if (svcSearch) {
      svcs = svcs.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase()));
    }
    return svcs;
  }, [allServices, selectedCityIds, svcSearch]);

  // Selected services in selection/drag order (not catalog order) — this is
  // what actually gets saved and shown to customers.
  const orderedSelectedServices = selectedServiceIds
    .map(id => allServices.find(s => Number(s.id) === id))
    .filter(Boolean);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setSelectedCityIds([]);
    setSelectedServiceIds([]);
    setSvcSearch('');
    setModal(true);
  };

  const openEdit = (combo) => {
    setEditTarget(combo);
    setSvcSearch('');
    setSelectedCityIds((combo.cityIds ?? []).map(Number));
    setSelectedServiceIds((combo.services ?? []).map(s => Number(s.serviceId ?? s.id)).filter(Boolean));
    setForm({
      title:          combo.title ?? '',
      description:    combo.description ?? '',
      image:          combo.image ?? '',
      price:          combo.price ? String(combo.price) : '',
      originalPrice:  combo.originalPrice ? String(combo.originalPrice) : '',
      isActive:       combo.isActive ?? true,
      showOnHome:     combo.showOnHome ?? false,
      validFrom:      combo.validFrom ? combo.validFrom.slice(0, 10) : '',
      validTill:      combo.validTill ? combo.validTill.slice(0, 10) : '',
      adminPercent:   parseFloat(combo.adminPercent ?? 20),
      partnerPercent: parseFloat(combo.partnerPercent ?? 80),
      gstPercent:     parseFloat(combo.gstPercent ?? 5),
    });
    setModal(true);
  };

  const toggleService = (id) => {
    const n = Number(id);
    setSelectedServiceIds(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'warning');
    if (!form.price || isNaN(parseFloat(form.price))) return showToast('Combo price is required', 'warning');
    if (selectedServiceIds.length === 0) return showToast('Select at least one service for the combo', 'warning');

    const selectedSvcs = selectedServiceIds.map(id => allServices.find(s => Number(s.id) === id)).filter(Boolean);
    const payload = {
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      image:         form.image.trim() || null,
      packageType:   'fixed',
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
      serviceCount: null,
      categoryId: null,
      adminPercent:   parseFloat(form.adminPercent ?? 20),
      partnerPercent: parseFloat(form.partnerPercent ?? 80),
      gstPercent:     parseFloat(form.gstPercent ?? 5),
    };

    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/api/v1/admin/packages/${editTarget.id}`, payload);
        showToast('Combo updated', 'success');
      } else {
        await api.post('/api/v1/admin/packages', payload);
        showToast('Combo created', 'success');
      }
      setModal(false);
      fetchCombos();
    } catch (e) {
      showToast(e?.response?.data?.message ?? 'Failed to save combo', 'danger');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/v1/admin/packages/${deleteTarget.id}`);
      setCombos(prev => prev.filter(p => p.id !== deleteTarget.id));
      showToast('Combo deleted', 'success');
    } catch {
      showToast('Failed to delete combo', 'danger');
    }
    setDeleteTarget(null);
  };

  const toggleActive = async (combo) => {
    try {
      await api.put(`/api/v1/admin/packages/${combo.id}`, { ...combo, isActive: !combo.isActive });
      setCombos(prev => prev.map(p => p.id === combo.id ? { ...p, isActive: !p.isActive } : p));
    } catch {
      showToast('Failed to update combo', 'danger');
    }
  };

  const filtered = combos.filter(p =>
    !search || (p.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reorderedScoped = Array.from(filtered);
    const [moved] = reorderedScoped.splice(result.source.index, 1);
    reorderedScoped.splice(result.destination.index, 0, moved);

    const scopedIds = new Set(filtered.map(p => p.id));
    let i = 0;
    setCombos(combos.map(p => (scopedIds.has(p.id) ? reorderedScoped[i++] : p)));

    try {
      await api.patch('/api/v1/packages/admin/reorder', {
        packageType: 'fixed',
        order: reorderedScoped.map(p => p.id),
      });
    } catch {
      showToast('Failed to save combo order.', 'danger');
      fetchCombos();
    }
  };

  const cityLabel = (combo) => {
    const ids = combo.cityIds ?? [];
    if (ids.length === 0) return 'All Cities';
    return ids.map(id => cities.find(c => c.id === Number(id))?.name ?? `#${id}`).join(', ');
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Combos</h1>
          <p className="page-subtitle">Pre-defined bundles of services at a fixed, discounted price</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={openCreate}>
          <Plus size={15} /> New Combo
        </button>
      </div>

      {/* ── List ── */}
      <div className="card">
        <div className="filters-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input className="search-input" placeholder="Search combos…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            {filtered.length} combo{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Boxes size={36} style={{ color: 'var(--c-text-muted)', display: 'block', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>No combos yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="form-hint" style={{ margin: '4px 0 8px' }}>Drag <GripVertical size={11} style={{ verticalAlign: -2 }} /> to reorder — this sets the display order on the website and app.</div>
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Combo</th>
                  <th>Locations</th>
                  <th>Services</th>
                  <th>Price</th>
                  <th>Valid Till</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="combos-reorder-list">
                  {(dropProvided) => (
                    <tbody ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {filtered.map((combo, index) => {
                        const savings = combo.originalPrice && Number(combo.originalPrice) > Number(combo.price)
                          ? Math.round(Number(combo.originalPrice) - Number(combo.price)) : null;
                        return (
                          <Draggable key={combo.id} draggableId={String(combo.id)} index={index}>
                            {(dragProvided, dragSnapshot) => (
                            <tr ref={dragProvided.innerRef} {...dragProvided.draggableProps} style={{ background: dragSnapshot.isDragging ? 'var(--c-border-light)' : undefined, ...dragProvided.draggableProps.style }}>
                              <td {...dragProvided.dragHandleProps} style={{ cursor: 'grab', color: 'var(--c-text-muted)', width: 24 }} title="Drag to reorder">
                                <GripVertical size={16} />
                              </td>
                              <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {combo.image && <img src={combo.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                          <div>
                            <div className="table-cell-main" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {combo.title}
                              {combo.showOnHome && (
                                <span title="Featured on home screen" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-brand-primary)', background: 'rgba(6,64,129,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                                  HOME
                                </span>
                              )}
                            </div>
                            {combo.description && <div className="table-cell-sub" style={{ maxWidth: 200 }}>{combo.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} style={{ color: 'var(--c-text-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12 }}>{cityLabel(combo)}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13 }}>{(combo.services ?? []).length} service{(combo.services ?? []).length !== 1 ? 's' : ''}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-brand-primary)' }}>₹{fmt(combo.price)}</div>
                        {savings && <div style={{ fontSize: 11, color: '#16a34a' }}>Save ₹{fmt(savings)}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          {combo.validTill ? new Date(combo.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox" checked={combo.isActive} onChange={() => toggleActive(combo)} />
                          <span style={{ fontSize: 12, color: combo.isActive ? '#16a34a' : 'var(--c-text-muted)' }}>
                            {combo.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEdit(combo)}><Edit2 size={14} /></button>
                          <button className="btn btn-ghost btn-icon" title="Delete" style={{ color: 'var(--c-danger)' }} onClick={() => setDeleteTarget(combo)}><Trash2 size={14} /></button>
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
        title={editTarget ? 'Edit Combo' : 'New Combo'}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Combo'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="e.g. Honey Wax Package" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Short description shown to users" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="form-label">Banner Image</label>
            <ImageUploader value={form.image} onChange={url => setForm(f => ({ ...f, image: url }))} width={140} height={74} />
          </div>

          <CityMultiSelect cities={cities} selected={selectedCityIds} onChange={setSelectedCityIds} />

          <div className="form-grid form-grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Combo Price (₹) *</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 650" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Original Price (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="e.g. 900" value={form.originalPrice}
                onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
            </div>
          </div>

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
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Feature this combo in the app's home screen header carousel</div>
            </div>
          </label>

          <RevenueSplitFields form={form} setForm={setForm} />

          <div style={{ background: 'var(--c-border-light)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                Included Services *
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
            {selectedCityIds.length > 1 && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px',
                background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: 6, marginBottom: 8, fontSize: 12,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <span>
                  Multi-city combo — only services <strong>available in all selected cities</strong> are shown.
                  Services restricted to a subset of your chosen cities are hidden to ensure every user can book all items in this combo.
                </span>
              </div>
            )}
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
            {selectedServiceIds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <AmountsSummary
                  selectedIds={selectedServiceIds}
                  allServices={allServices}
                  packagePrice={form.price}
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
        title="Delete Combo"
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
