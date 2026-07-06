import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Package, Search, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { Badge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import RevenueSplitFields from '../components/common/RevenueSplitFields';
import ImageUploader from '../components/common/ImageUploader';
import api from '../services/api';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

const emptyForm = () => ({
  title: '',
  description: '',
  image: '',
  packageType: 'fixed',
  price: '',
  originalPrice: '',
  serviceCount: '',
  filterCategoryId: '',   // for flexible: restrict to category
  isActive: true,
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

// ── Category accordion + service checkboxes ───────────────────────────────────
function ServiceTree({ categories, services, selectedIds, onToggle }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (catId) => setExpanded(p => ({ ...p, [catId]: !p[catId] }));

  // Group services by categoryId
  const byCat = useMemo(() => {
    const map = {};
    for (const svc of services) {
      const cid = svc.categoryId ?? 0;
      if (!map[cid]) map[cid] = [];
      map[cid].push(svc);
    }
    return map;
  }, [services]);

  const usedCatIds = Object.keys(byCat).map(Number);
  const visibleCats = categories.filter(c => usedCatIds.includes(Number(c.id ?? c._id)));

  if (services.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>
        {services.length === 0 ? 'Select at least one location to see available services.' : 'No services found.'}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
      {visibleCats.map((cat, idx) => {
        const catId = cat.id ?? cat._id;
        const catSvcs = byCat[catId] ?? [];
        const checkedCount = catSvcs.filter(s => selectedIds.includes(Number(s.id))).length;
        const isOpen = expanded[catId] ?? false;

        return (
          <div key={catId} style={{ borderBottom: idx < visibleCats.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggle(catId)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: isOpen ? 'var(--c-border-light)' : '#fff',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              {cat.image && (
                <img src={cat.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
              )}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{cat.name}</span>
              <span style={{ fontSize: 12, color: checkedCount > 0 ? 'var(--c-brand-primary)' : 'var(--c-text-muted)' }}>
                {checkedCount > 0 ? `${checkedCount} selected` : `${catSvcs.length} service${catSvcs.length !== 1 ? 's' : ''}`}
              </span>
            </button>

            {/* Service rows */}
            {isOpen && (
              <div style={{ background: '#fafafa' }}>
                {catSvcs.map(svc => {
                  const checked = selectedIds.includes(Number(svc.id));
                  return (
                    <label
                      key={svc.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px 8px 38px', cursor: 'pointer',
                        background: checked ? '#f0faf5' : 'transparent',
                        borderTop: '1px solid var(--c-border-light)',
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => onToggle(Number(svc.id))} />
                      {svc.image && (
                        <img src={svc.image} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1, fontSize: 13 }}>{svc.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>
                        {svc.duration ? `${svc.duration} min · ` : ''}₹{fmt(svc.basePrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Uncategorised services */}
      {(byCat[0] ?? []).length > 0 && (
        <div style={{ borderTop: '1px solid var(--c-border)' }}>
          <button
            type="button"
            onClick={() => toggle(0)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: expanded[0] ? 'var(--c-border-light)' : '#fff', border: 'none', cursor: 'pointer' }}
          >
            {expanded[0] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Other</span>
          </button>
          {expanded[0] && (byCat[0] ?? []).map(svc => {
            const checked = selectedIds.includes(Number(svc.id));
            return (
              <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 38px', cursor: 'pointer', background: checked ? '#f0faf5' : 'transparent', borderTop: '1px solid var(--c-border-light)' }}>
                <input type="checkbox" checked={checked} onChange={() => onToggle(Number(svc.id))} />
                <span style={{ flex: 1, fontSize: 13 }}>{svc.name}</span>
                <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>₹{fmt(svc.basePrice)}</span>
              </label>
            );
          })}
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
        <div style={{ color: 'var(--c-text-muted)', fontSize: 11, marginBottom: 2 }}>Package price</div>
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
export default function Packages() {
  const { showToast } = useAuth();
  const { cityParam } = useCityFilter();
  const [packages, setPackages]     = useState([]);
  const [allServices, setAllServices] = useState([]);   // full list, unfiltered
  const [categories, setCategories] = useState([]);
  const [cities, setCities]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [svcSearch, setSvcSearch]   = useState('');
  const [modal, setModal]           = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [selectedCityIds, setSelectedCityIds] = useState([]);   // multi-location
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

  const fetchPackages = () => {
    setLoading(true);
    const params = cityParam ? { cityIds: cityParam } : {};
    api.get('/api/v1/admin/packages', { params })
      .then(r => setPackages(r.data?.data ?? []))
      .catch(() => showToast('Failed to load packages', 'danger'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPackages(); }, [cityParam]);

  // serviceAvailableInAllCities: returns true if the service is usable across ALL the given cityIds.
  // Global service (cityIds=[]) is available everywhere. City-specific service must have
  // an active mapping for every selected city.
  const serviceAvailableInAll = (svc, cityIds) => {
    const mapped = svc.cityIds ?? [];
    if (mapped.length === 0) return true; // global
    return cityIds.every(cid => mapped.includes(Number(cid)));
  };

  // When city selection changes, drop selected services that are no longer available in all chosen cities
  useEffect(() => {
    if (selectedServiceIds.length === 0) return;
    const validIds = new Set(
      allServices
        .filter(s => serviceAvailableInAll(s, selectedCityIds))
        .map(s => Number(s.id))
    );
    setSelectedServiceIds(prev => prev.filter(id => validIds.has(id)));
  }, [selectedCityIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Services visible in the picker: must be available in ALL selected cities
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
    setSvcSearch('');
    setSelectedCityIds((pkg.cityIds ?? []).map(Number));
    setSelectedServiceIds((pkg.services ?? []).map(s => Number(s.serviceId ?? s.id)).filter(Boolean));
    setForm({
      title:          pkg.title ?? '',
      description:    pkg.description ?? '',
      image:          pkg.image ?? '',
      packageType:    pkg.packageType ?? 'fixed',
      price:          pkg.price ? String(pkg.price) : '',
      originalPrice:  pkg.originalPrice ? String(pkg.originalPrice) : '',
      serviceCount:   pkg.serviceCount ? String(pkg.serviceCount) : '',
      filterCategoryId: pkg.categoryId ? String(pkg.categoryId) : '',
      isActive:       pkg.isActive ?? true,
      validFrom:      pkg.validFrom ? pkg.validFrom.slice(0, 10) : '',
      validTill:      pkg.validTill ? pkg.validTill.slice(0, 10) : '',
      adminPercent:   parseFloat(pkg.adminPercent ?? 20),
      partnerPercent: parseFloat(pkg.partnerPercent ?? 80),
      gstPercent:     parseFloat(pkg.gstPercent ?? 5),
    });
    setModal(true);
  };

  const toggleService = (id) => {
    const n = Number(id);
    setSelectedServiceIds(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'warning');
    if (!form.price || isNaN(parseFloat(form.price))) return showToast('Package price is required', 'warning');
    if (form.packageType === 'fixed' && selectedServiceIds.length === 0)
      return showToast('Select at least one service for a fixed package', 'warning');
    if (form.packageType === 'flexible' && !form.serviceCount)
      return showToast('Service count is required for flexible packages', 'warning');

    const selectedSvcs = allServices.filter(s => selectedServiceIds.includes(Number(s.id)));
    const payload = {
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      image:         form.image.trim() || null,
      packageType:   form.packageType,
      price:         parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      isActive:      form.isActive,
      cityIds:       selectedCityIds,
      validFrom:     form.validFrom || null,
      validTill:     form.validTill || null,
      services: form.packageType === 'fixed'
        ? selectedSvcs.map(s => ({
            serviceId: Number(s.id),
            name: s.name,
            price: parseFloat(s.basePrice ?? 0),
            duration: s.duration ?? null,
            image: s.image ?? null,
          }))
        : [],
      serviceCount: form.packageType === 'flexible' ? Number(form.serviceCount) : null,
      categoryId:   form.packageType === 'flexible' && form.filterCategoryId ? Number(form.filterCategoryId) : null,
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
          <h1 className="page-title">Service Packages</h1>
          <p className="page-subtitle">Bundle services at a special price — fixed combos or flexible pick-N deals</p>
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
            <table className="table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Locations</th>
                  <th>Type</th>
                  <th>Services</th>
                  <th>Price</th>
                  <th>Valid Till</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(pkg => {
                  const savings = pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price)
                    ? Math.round(Number(pkg.originalPrice) - Number(pkg.price)) : null;
                  return (
                    <tr key={pkg.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {pkg.image && <img src={pkg.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                          <div>
                            <div className="table-cell-main">{pkg.title}</div>
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
                        <Badge
                          status={pkg.packageType === 'fixed' ? 'active' : 'warning'}
                          label={pkg.packageType === 'fixed' ? 'Fixed' : 'Flexible'}
                        />
                      </td>
                      <td>
                        {pkg.packageType === 'fixed'
                          ? <span style={{ fontSize: 13 }}>{(pkg.services ?? []).length} service{(pkg.services ?? []).length !== 1 ? 's' : ''}</span>
                          : <span style={{ fontSize: 13 }}>Any {pkg.serviceCount ?? 1}</span>
                        }
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
                  );
                })}
              </tbody>
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

          {/* Package Type + Price + Original Price */}
          <div className="form-grid form-grid-3" style={{ gap: 12 }}>
            <div>
              <label className="form-label">Package Type *</label>
              <select className="form-input" value={form.packageType}
                onChange={e => setForm(f => ({ ...f, packageType: e.target.value }))}>
                <option value="fixed">Fixed (pre-defined services)</option>
                <option value="flexible">Flexible (user picks N)</option>
              </select>
            </div>
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

          <RevenueSplitFields form={form} setForm={setForm} />

          {/* ── Fixed: category tree service picker ── */}
          {form.packageType === 'fixed' && (
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
                    Multi-city package — only services <strong>available in all selected cities</strong> are shown.
                    Services restricted to a subset of your chosen cities are hidden to ensure every user can book all items in this package.
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
              {/* Amounts summary */}
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
          )}

          {/* ── Flexible: count + optional category restriction ── */}
          {form.packageType === 'flexible' && (
            <div style={{ background: 'var(--c-border-light)', borderRadius: 8, padding: '12px 14px' }}>
              <label className="form-label" style={{ marginBottom: 10 }}>Flexible Settings</label>
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
          )}
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
