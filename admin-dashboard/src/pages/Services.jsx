import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit2, Power, Search, Users, ShoppingBag, DollarSign, Trash2, FolderOpen, Upload, RefreshCw, MapPin, CheckCircle, XCircle, GripVertical, ListOrdered, Flame } from 'lucide-react';
import { Badge, StarRating } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import RevenueSplitFields, { revenueSplitPayload } from '../components/common/RevenueSplitFields';
import { useAuth } from '../context/AuthContext';
import { useServices, useCategories } from '../hooks/useServices';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import api from '../services/api';

export const DEFAULT_CATEGORIES = [
  'Men Grooming', 'Haircut', 'Hair Spa', 'Hair Colour',
  'Head Massage', 'Hair Treatments', 'Threading', 'Waxing',
  'De-Tan', 'Facials', 'Peeloff Mask', 'Pedicure',
  'Manicure', 'Mehndi', 'Nail Art', 'Bridal Services',
];

export const ImagePicker = ({ value, onChange, label = 'Image', hint = 'JPEG, PNG or WebP · Max 2 MB', exactWidth, exactHeight }) => {
  const [uploading, setUploading] = useState(false);

  const checkDimensions = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject('Could not read image.'); };
      img.src = url;
    });

  const [dimError, setDimError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDimError('');

    if (file.size > 2 * 1024 * 1024) {
      setDimError('File too large — max 2 MB.');
      e.target.value = '';
      return;
    }

    if (exactWidth && exactHeight) {
      try {
        const { w, h } = await checkDimensions(file);
        if (w !== exactWidth || h !== exactHeight) {
          setDimError(`Wrong size: image is ${w}×${h} px. Required: ${exactWidth}×${exactHeight} px.`);
          e.target.value = '';
          return;
        }
      } catch (err) {
        setDimError(err);
        e.target.value = '';
        return;
      }
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/api/v1/admin/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.status) onChange(res.data.url);
    } catch {
      // silently fail — user can retry
    }
    setUploading(false);
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {value ? (
          <img
            src={value}
            alt="preview"
            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--c-border)', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, border: '2px dashed var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--c-text-muted)' }}>
            <Upload size={20} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block' }}>
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
            <span className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Upload size={13} /> {uploading ? 'Uploading…' : (value ? 'Change' : 'Choose Image')}
            </span>
          </label>
          {value && (
            <button type="button" style={{ marginTop: 6, fontSize: 12, color: 'var(--c-danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => onChange('')}>
              Remove
            </button>
          )}
          <div className="form-hint" style={{ marginTop: 4 }}>{hint}</div>
          {dimError && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--c-danger)' }}>{dimError}</div>}
        </div>
      </div>
    </div>
  );
};

// Multi-city selection: no selection = global (available everywhere)
export const CityMultiSelect = ({ selected, onChange, cities, hint }) => (
  <div className="form-group">
    <label className="form-label">
      Available In
      <span style={{ fontWeight: 400, color: 'var(--c-text-muted)', marginLeft: 6 }}>
        (none selected = all cities)
      </span>
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
    </div>
    {hint && <div className="form-hint" style={{ marginTop: 4 }}>{hint}</div>}
  </div>
);

// Per-city editor used in the Edit modal.
// Shows mapped cities as rows with live toggle, a per-city price override and remove;
// unmapped as "+ add" chips. A blank price means "charge the global base price here".
const ServiceCityEditor = ({ mappings, cities, basePrice, onToggle, onAdd, onRemove, onPriceChange }) => {
  const mappedIds = mappings.map(m => m.cityId);
  const unmapped  = cities.filter(c => !mappedIds.includes(c.id));

  return (
    <div className="form-group">
      <label className="form-label">
        Available In
        <span style={{ fontWeight: 400, color: 'var(--c-text-muted)', marginLeft: 6 }}>
          (none = all cities)
        </span>
      </label>

      {/* Mapped cities — one row each, with its own optional price */}
      {mappings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {mappings.map(m => {
            const city = cities.find(c => c.id === m.cityId);
            if (!city) return null;
            const active = m.isActive ?? true;
            const overridden = m.customPrice !== null && m.customPrice !== undefined && m.customPrice !== '';
            return (
              <div key={m.cityId} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px 6px 10px', borderRadius: 8, fontSize: 12,
                border: `1.5px solid ${active ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                background: active ? 'rgba(0,0,0,0.02)' : '#f3f4f6',
                color: active ? 'var(--c-text)' : 'var(--c-text-muted)',
              }}>
                <MapPin size={11} style={{ flexShrink: 0, color: active ? 'var(--c-brand-primary)' : 'var(--c-text-muted)' }} />
                <span style={{ fontWeight: 600, flex: 1, minWidth: 0 }}>{city.name}</span>

                {/* Per-city price — blank inherits the global base price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <span style={{ color: 'var(--c-text-muted)' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    value={m.customPrice ?? ''}
                    placeholder={basePrice ? String(basePrice) : 'base'}
                    onChange={e => onPriceChange(m.cityId, e.target.value)}
                    title={overridden ? `This city charges ₹${m.customPrice}` : 'Using the global base price — type a number to override it here'}
                    style={{
                      width: 74, padding: '3px 6px', fontSize: 12, borderRadius: 5,
                      border: `1px solid ${overridden ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                      fontWeight: overridden ? 600 : 400,
                      background: '#fff', color: 'inherit',
                    }}
                  />
                </div>

                {/* Active/paused toggle */}
                <button
                  type="button"
                  title={active ? 'Pause in this city' : 'Resume in this city'}
                  onClick={() => onToggle(m.cityId, !active)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
                    background: active ? 'var(--c-brand-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 8, color: active ? '#fff' : 'var(--c-text-muted)', lineHeight: 1 }}>
                    {active ? '●' : '○'}
                  </span>
                </button>

                {/* Remove */}
                <button
                  type="button"
                  title="Remove from this city"
                  onClick={() => onRemove(m.cityId)}
                  style={{
                    width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'var(--c-border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    fontSize: 12, color: 'var(--c-text-muted)', flexShrink: 0,
                  }}
                >×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Unmapped cities — click to add */}
      {unmapped.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {unmapped.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => onAdd(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: '1.5px dashed var(--c-border)', background: 'transparent',
                color: 'var(--c-text-muted)', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> {c.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--c-text-muted)' }}>
        <strong>●</strong> active &nbsp;·&nbsp; <strong>○</strong> paused (service won't appear in that city) &nbsp;·&nbsp; <strong>×</strong> remove
        <br />
        Leave a city's <strong>₹</strong> blank to charge the base price above; enter a number to set that city's own price.
      </div>
    </div>
  );
};

export default function Services() {
  const { showToast } = useAuth();
  const { fetchList: fetchServices, action: svcAction } = useServices();
  const { fetchList: fetchCats, create: catCreate, update: catUpdate, remove: catRemove, action: catAction } = useCategories();
  const { cityId, cities } = useCityFilter();
  const [services, setServices]       = useState([]);
  const [cats, setCatList]            = useState([]);
  const [search, setSearch]           = useState('');
  const [catFilter, setCat]           = useState('all');
  const [editing, setEditing]         = useState(null);
  const [editMappings, setEditMappings] = useState([]); // [{cityId, isActive}] for edit modal
  const [adding, setAdding]           = useState(false);
  const [form, setForm]               = useState({});
  const [managingCats, setMngCats]    = useState(false);
  const [editingCat, setEditingCat]   = useState(null);
  const [catForm, setCatForm]         = useState({});
  const [seedingCats, setSeedingCats] = useState(false);
  const [reorderingSvcs, setReorderingSvcs] = useState(false);

  // Subcategories — the optional second level under a category (Waxing -> Honey/Rica).
  // Loaded flat for every category; the modal and the service form filter by categoryId.
  const [subcats, setSubcats] = useState([]);
  const [managingSubcats, setMngSubcats] = useState(false);
  const [editingSubcat, setEditingSubcat] = useState(null);
  const [subcatForm, setSubcatForm] = useState({ categoryId: '', name: '' });

  const loadServices = () => {
    const params = cityId ? { cityId, limit: 1000 } : { limit: 1000 };
    fetchServices(params).then(res => {
      if (res.ok) setServices((res.data?.data ?? []).map(s => ({
        ...s,
        id: String(s.id),
        status: s.status ?? (s.isActive !== false ? 'active' : 'inactive'),
        // basePrice is the effective price for the selected city (the API applies the
        // per-city override); baseServicePrice is always the global figure.
        basePrice: parseFloat(s.basePrice ?? 0),
        baseServicePrice: parseFloat(s.baseServicePrice ?? s.basePrice ?? 0),
        cityMappings: Array.isArray(s.cityMappings) ? s.cityMappings : [],
        partners: s.partners ?? 0,
        revenue: s.revenue ?? 0,
        totalBookings: s.totalBookings ?? 0,
        monthlyBookings: s.monthlyBookings ?? 0,
        rating: parseFloat(s.rating ?? 0),
        category: s.category?.name ?? s.category ?? '—',
        icon: s.icon ?? '✨',
        color: s.color ?? 'var(--c-border-light)',
        image: s.image ?? null,
        description: s.description ?? '',
        priceStartsFrom: s.priceStartsFrom ?? false,
        isPopular: s.isPopular ?? false,
        showOnHome: s.showOnHome ?? false,
        cityIds: Array.isArray(s.cityIds) ? s.cityIds : [],
      })));
    });
    fetchCats(params).then(res => { if (res.ok) setCatList(res.data?.data ?? []); });
  };

  useEffect(() => { loadServices(); }, [cityId]);
  useAutoRefresh(loadServices);

  // ---- Subcategories (optional second level under a category) ----
  const loadSubcats = () => {
    api.get('/api/v1/admin/services/subcategories')
      .then(res => setSubcats(res.data?.data ?? []))
      .catch(() => {});
  };
  useEffect(() => { loadSubcats(); }, []);

  const subcatsForCategory = (categoryId) =>
    subcats.filter(s => String(s.categoryId) === String(categoryId));

  const saveSubcat = async () => {
    if (!subcatForm.categoryId) { showToast('Pick a category for the subcategory.', 'danger'); return; }
    if (!subcatForm.name?.trim()) { showToast('Subcategory name is required.', 'danger'); return; }
    const payload = {
      categoryId: Number(subcatForm.categoryId),
      name: subcatForm.name.trim(),
      description: subcatForm.description ?? '',
    };
    try {
      if (editingSubcat) {
        await api.patch(`/api/v1/admin/services/subcategories/${editingSubcat.id}`, payload);
        showToast('Subcategory updated!', 'success');
      } else {
        await api.post('/api/v1/admin/services/subcategories', payload);
        showToast('Subcategory added!', 'success');
      }
      setEditingSubcat(null);
      setSubcatForm({ categoryId: subcatForm.categoryId, name: '' });
      loadSubcats();
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to save subcategory.', 'danger');
    }
  };

  const toggleSubcatActive = async (sub) => {
    try {
      await api.patch(`/api/v1/admin/services/subcategories/${sub.id}`, { isActive: !sub.isActive });
      loadSubcats();
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to update.', 'danger');
    }
  };

  const deleteSubcat = async (sub) => {
    // The backend detaches its services rather than deleting them, so this only ever
    // costs the grouping — worth saying out loud before it happens.
    if (!window.confirm(`Delete "${sub.name}"? Its services stay, but lose this subcategory.`)) return;
    try {
      await api.delete(`/api/v1/admin/services/subcategories/${sub.id}`);
      showToast('Subcategory deleted.', 'danger');
      loadSubcats();
      loadServices();
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to delete.', 'danger');
    }
  };

  const categories = ['all', ...cats.map(c => c.name ?? c)];

  const filtered = services.filter(s =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.category ?? '').toLowerCase().includes(search.toLowerCase()))
    && (catFilter === 'all' || s.category === catFilter)
  );

  const handleSvcDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const catObj = cats.find(c => c.name === catFilter);
    if (!catObj) return;
    const scoped = services.filter(s => s.category === catFilter);
    const reorderedScoped = Array.from(scoped);
    const [moved] = reorderedScoped.splice(result.source.index, 1);
    reorderedScoped.splice(result.destination.index, 0, moved);

    let i = 0;
    setServices(services.map(s => (s.category === catFilter ? reorderedScoped[i++] : s)));

    const res = await svcAction('patch', '/api/v1/admin/services/reorder', {
      categoryId: catObj.id,
      order: reorderedScoped.map(s => s.id),
    });
    if (!res.ok) {
      showToast(res.error ?? 'Failed to save service order.', 'danger');
      loadServices();
    }
  };

  const toggleStatus = async (id) => {
    const svc = services.find(s => s.id === id);
    const newActive = !(svc.isActive ?? svc.status === 'active');
    const res = await svcAction('patch', `/api/v1/admin/services/${id}`, { isActive: newActive });
    if (res.ok) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: newActive, status: newActive ? 'active' : 'inactive' } : s));
      showToast(`${svc.name} ${newActive ? 'activated' : 'deactivated'}.`, newActive ? 'success' : 'danger');
    } else {
      showToast(res.error ?? 'Failed to update status.', 'danger');
    }
  };

  // ---- Categories ----
  const defaultCatForm = () => ({ cityIds: [], adminPercent: 20, partnerPercent: 80, gstPercent: 5 });

  const saveCat = async () => {
    if (!catForm.name) { showToast('Category name is required.', 'danger'); return; }
    const payload = {
      ...catForm,
      cityIds: catForm.cityIds ?? [],
      ...revenueSplitPayload(catForm),
    };
    if (editingCat) {
      const res = await catUpdate(String(editingCat._id ?? editingCat.id), payload);
      if (res.ok) {
        setCatList(prev => prev.map(c => String(c._id ?? c.id) === String(editingCat._id ?? editingCat.id) ? { ...c, ...payload } : c));
        showToast('Category updated!', 'success');
        setEditingCat(null); setCatForm(defaultCatForm());
      } else showToast(res.error ?? 'Failed to update.', 'danger');
    } else {
      const res = await catCreate(payload);
      if (res.ok) {
        setCatList(prev => [...prev, res.data?.data ?? payload]);
        showToast('Category added!', 'success');
        setCatForm(defaultCatForm());
      } else showToast(res.error ?? 'Failed to add category.', 'danger');
    }
  };

  const deleteCat = async (id) => {
    const res = await catRemove(String(id));
    if (res.ok) {
      setCatList(prev => prev.filter(c => String(c._id ?? c.id) !== String(id)));
      showToast('Category deleted.', 'danger');
    } else showToast(res.error ?? 'Failed to delete.', 'danger');
  };

  const handleCatDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = Array.from(cats);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setCatList(reordered);
    const res = await catAction('patch', '/api/v1/admin/services/categories/reorder', { order: reordered.map(c => c._id ?? c.id) });
    if (!res.ok) {
      showToast(res.error ?? 'Failed to save category order.', 'danger');
      fetchCats(cityId ? { cityId, limit: 1000 } : { limit: 1000 }).then(r => { if (r.ok) setCatList(r.data?.data ?? []); });
    }
  };

  const toggleCatStatus = async (cat) => {
    const newActive = !(cat.isActive ?? true);
    const res = await catUpdate(String(cat._id ?? cat.id), {
      name: cat.name,
      description: cat.description ?? '',
      image: cat.image ?? '',
      cityIds: cat.cityIds ?? [],
      isActive: newActive,
      showOnHome: cat.showOnHome ?? false,
      adminPercent:   parseFloat(cat.adminPercent   ?? 20),
      partnerPercent: parseFloat(cat.partnerPercent ?? 80),
      gstPercent:     parseFloat(cat.gstPercent     ?? 18),
    });
    if (res.ok) {
      setCatList(prev => prev.map(c =>
        String(c._id ?? c.id) === String(cat._id ?? cat.id)
          ? { ...c, isActive: newActive }
          : c
      ));
      showToast(`"${cat.name}" ${newActive ? 'activated' : 'deactivated'}.`, newActive ? 'success' : 'danger');
    } else {
      showToast(res.error ?? 'Failed to update status.', 'danger');
    }
  };

  const seedCategories = async () => {
    setSeedingCats(true);
    let added = 0;
    for (const name of DEFAULT_CATEGORIES) {
      if (cats.some(c => c.name === name)) continue;
      const res = await catCreate({ name, cityIds: [] });
      if (res.ok) {
        setCatList(prev => [...prev, res.data?.data ?? { name }]);
        added++;
      }
    }
    showToast(
      added > 0 ? `Added ${added} default categories!` : 'All default categories already exist.',
      'success'
    );
    setSeedingCats(false);
  };

  // ---- Services ----
  const openEdit = (svc) => {
    setEditing(svc);
    // Build editMappings from cityMappings (has isActive per city) or fall back to cityIds (all active)
    const mappings = Array.isArray(svc.cityMappings) && svc.cityMappings.length > 0
      ? svc.cityMappings.map(m => ({
          cityId: Number(m.cityId),
          isActive: m.isActive ?? true,
          customPrice: m.customPrice == null ? '' : String(m.customPrice),
        }))
      : (svc.cityIds ?? []).map(id => ({ cityId: Number(id), isActive: true, customPrice: '' }));
    setEditMappings(mappings);
    setForm({
      name: svc.name,
      categoryId: String(svc.categoryId ?? ''),
      // '' renders as the "None" option; anything else preselects the current one.
      subcategoryId: svc.subcategoryId == null ? '' : String(svc.subcategoryId),
      // The global base price, never the selected city's overridden one — otherwise
      // saving from a city view would write that city's rate onto every other city.
      basePrice: svc.baseServicePrice ?? svc.basePrice,
      duration: svc.duration ?? 60,
      description: svc.description ?? '',
      image: svc.image ?? '',
      priceStartsFrom: svc.priceStartsFrom ?? false,
      isPopular: svc.isPopular ?? false,
      showOnHome: svc.showOnHome ?? false,
    });
  };

  const handleCityToggle = async (cityId, isActive) => {
    if (!editing) return;
    try {
      await api.patch(`/api/v1/admin/services/${editing.id}/cities/${cityId}`, { isActive });
      setEditMappings(prev => prev.map(m => m.cityId === cityId ? { ...m, isActive } : m));
      // Reflect in the main services list too
      setServices(prev => prev.map(s => {
        if (s.id !== editing.id) return s;
        const maps = (s.cityMappings ?? []).map(m => Number(m.cityId) === cityId ? { ...m, isActive } : m);
        return { ...s, cityMappings: maps, cityIds: maps.filter(m => m.isActive).map(m => m.cityId) };
      }));
      showToast(`${isActive ? 'Resumed' : 'Paused'} in ${cities.find(c => c.id === cityId)?.name ?? 'city'}`, isActive ? 'success' : 'warning');
    } catch {
      showToast('Failed to update city status', 'danger');
    }
  };

  const handleCityAdd = (cityId) =>
    setEditMappings(prev => [...prev, { cityId, isActive: true, customPrice: '' }]);

  // Empty string = no override for this city (falls back to the global base price).
  const handleCityPriceChange = (cityId, value) =>
    setEditMappings(prev => prev.map(m => m.cityId === cityId ? { ...m, customPrice: value } : m));

  const handleCityRemove = (cityId) =>
    setEditMappings(prev => prev.filter(m => m.cityId !== cityId));

  const saveEdit = async () => {
    const payload = {
      name: form.name,
      categoryId: form.categoryId || String(editing.categoryId ?? ''),
      // "" is the form's "None" option; the backend turns it into a real NULL.
      subcategoryId: form.subcategoryId === '' || form.subcategoryId == null ? null : Number(form.subcategoryId),
      basePrice: +form.basePrice,
      duration: +form.duration,
      description: form.description ?? '',
      priceStartsFrom: !!form.priceStartsFrom,
      isPopular: !!form.isPopular,
      showOnHome: !!form.showOnHome,
      // A blank per-city box means "no override" — send null so the backend clears it,
      // rather than dropping the key (which would keep the old override).
      cityMappings: editMappings.map(m => ({
        cityId: m.cityId,
        isActive: m.isActive,
        customPrice: m.customPrice === '' || m.customPrice == null ? null : +m.customPrice,
      })),
      ...(form.image ? { image: form.image } : {}),
    };
    const res = await svcAction('put', `/api/v1/admin/services/${editing.id}`, payload);
    if (res.ok) {
      // Reload rather than patching locally: the row's displayed price depends on the
      // selected city's override, which only the server resolves.
      loadServices();
      showToast('Service updated successfully!', 'success');
      setEditing(null);
    } else {
      showToast(res.error ?? 'Failed to update service.', 'danger');
    }
  };

  const saveNew = async () => {
    if (!form.name || !form.basePrice || !form.categoryId) {
      showToast('Please fill name, category and base price.', 'danger');
      return;
    }
    const payload = {
      name: form.name,
      categoryId: String(form.categoryId),
      subcategoryId: form.subcategoryId === '' || form.subcategoryId == null ? null : Number(form.subcategoryId),
      basePrice: +form.basePrice,
      duration: +form.duration,
      description: form.description ?? '',
      priceStartsFrom: !!form.priceStartsFrom,
      isPopular: !!form.isPopular,
      showOnHome: !!form.showOnHome,
      isActive: true,
      cityIds: form.cityIds ?? [],
      ...(form.image ? { image: form.image } : {}),
    };
    const res = await svcAction('post', '/api/v1/admin/services', payload);
    if (res.ok) {
      const s = res.data?.data ?? {};
      const catName = cats.find(c => String(c.id) === String(form.categoryId))?.name ?? '—';
      setServices(prev => [...prev, {
        ...s,
        id: String(s.id ?? Date.now()),
        status: 'active', isActive: true,
        basePrice: parseFloat(s.basePrice ?? form.basePrice),
        partners: 0, totalBookings: 0, monthlyBookings: 0, rating: 0, revenue: 0,
        category: catName,
        icon: '✨',
        color: 'var(--c-border-light)',
        image: form.image ?? null,
        description: form.description ?? '',
        duration: payload.duration,
        priceStartsFrom: payload.priceStartsFrom,
        isPopular: payload.isPopular,
        showOnHome: payload.showOnHome,
        cityIds: payload.cityIds,
      }]);
      showToast('Service added successfully!', 'success');
      setAdding(false);
    } else {
      showToast(res.error ?? 'Failed to add service.', 'danger');
    }
  };

  const safeServices = Array.isArray(services) ? services : []
  const stats = {
    total:    safeServices.length,
    active:   safeServices.filter(s => s.status === 'active' || s.isActive).length,
    partners: safeServices.reduce((a, s) => a + (s.partners ?? 0), 0),
    revenue:  safeServices.reduce((a, s) => a + (s.revenue ?? 0), 0),
  };

  // True when the displayed price is the selected city's own rate, not the global base.
  const hasCityPrice = (svc) =>
    !!cityId && (svc.cityMappings ?? []).some(
      m => Number(m.cityId) === Number(cityId) && m.isActive && m.customPrice != null
    );

  const selectedCityName = cities.find(c => c.id === cityId)?.name ?? '';

  const getCityNames = (cityIds = []) =>
    cityIds.map(id => cities.find(c => c.id === id)?.name ?? `City ${id}`).join(', ');

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: <ShoppingBag size={20}/>, label: 'Total Services', value: stats.total,   color: '#064081' },
          { icon: <Power size={20}/>,       label: 'Active',         value: stats.active,  color: '#22C55E' },
          { icon: <Users size={20}/>,       label: 'Total Partners', value: stats.partners, color: '#FF9500' },
          { icon: <DollarSign size={20}/>,  label: 'Total Revenue',  value: `₹${(stats.revenue / 100000).toFixed(1)}L`, color: '#02B0E8' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--c-border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-brand-primary)' }}>{s.icon}</div>
              <div className="stat-label">{s.label}</div>
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Service Catalog</div>
            <div className="card-subtitle">{filtered.length} services listed</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="search-input-wrap" style={{ minWidth: 200 }}>
              <Search size={16} />
              <input className="search-input" placeholder="Search services…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={catFilter} onChange={e => { setCat(e.target.value); setReorderingSvcs(false); }}>
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
            {catFilter !== 'all' && (
              <button
                className={`btn btn-sm ${reorderingSvcs ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setSearch(''); setReorderingSvcs(r => !r); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ListOrdered size={14}/> {reorderingSvcs ? 'Done Reordering' : 'Reorder'}
              </button>
            )}
            {/* Categories / Subcategories buttons hidden from this toolbar — both are
                now managed in the dedicated Categories module (/catalog). Same approach
                as the hidden Coupons and Offers nav items: the modals and every handler
                below stay intact, they're just no longer opened from here.
            <button className="btn btn-outline btn-sm" onClick={() => { setMngCats(true); setEditingCat(null); setCatForm({ cityIds: [], adminPercent: 20, partnerPercent: 80, gstPercent: 5 }); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderOpen size={14}/> Categories
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => { setMngSubcats(true); setEditingSubcat(null); setSubcatForm({ categoryId: cats[0]?.id ?? '', name: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FolderOpen size={14}/> Subcategories
            </button>
            */}
            <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setForm({ name: '', basePrice: '', duration: 60, description: '', image: '', cityIds: [] }); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14}/> Add Service
            </button>
          </div>
        </div>

        {reorderingSvcs ? (
          <div style={{ padding: 20 }}>
            <div className="form-hint" style={{ marginBottom: 12 }}>
              Drag to set the order these services appear in "{catFilter}" on the app and website.
            </div>
            <DragDropContext onDragEnd={handleSvcDragEnd}>
              <Droppable droppableId="services-reorder-list">
                {(dropProvided) => (
                  <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                    {services.filter(s => s.category === catFilter).map((svc, index) => (
                      <Draggable key={svc.id} draggableId={String(svc.id)} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                              border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', marginBottom: 8,
                              background: dragSnapshot.isDragging ? 'var(--c-border-light)' : '#fff',
                              ...dragProvided.draggableProps.style,
                            }}
                          >
                            <span {...dragProvided.dragHandleProps} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--c-text-muted)', display: 'flex', flexShrink: 0 }}>
                              <GripVertical size={16} />
                            </span>
                            {svc.image ? (
                              <img src={svc.image} alt={svc.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                            ) : (
                              <span style={{ fontSize: 20, flexShrink: 0 }}>{svc.icon}</span>
                            )}
                            <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 13 }}>{svc.name}</div>
                            <div style={{ marginRight: 12, fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 600 }}>
                              {svc.duration ? `${svc.duration} min` : ''}
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text-secondary)' }}>
                              {svc.priceStartsFrom && <span style={{ fontWeight: 400 }}>Starts from </span>}₹{svc.basePrice.toLocaleString()}
                              {hasCityPrice(svc) && (
                                <span
                                  title={`${selectedCityName} has its own price (base is ₹${(svc.baseServicePrice ?? 0).toLocaleString()})`}
                                  style={{
                                    marginLeft: 5, fontSize: 9, fontWeight: 700, padding: '1px 5px',
                                    borderRadius: 4, background: 'var(--c-brand-primary)', color: '#fff',
                                    verticalAlign: 'middle', letterSpacing: 0.3,
                                  }}
                                >{selectedCityName.toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {dropProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        ) : (
        <div className="form-grid form-grid-3" style={{ padding: 20 }}>
          {filtered.map(svc => (
            <div key={svc.id} style={{
              border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
              transition: 'var(--t-base)', opacity: svc.status === 'inactive' ? 0.65 : 1,
            }}>
              {/* Header with image or color strip */}
              <div style={{
                background: svc.image ? 'transparent' : (svc.color || 'var(--c-border-light)'),
                height: svc.image ? 140 : 'auto',
                padding: svc.image ? 0 : '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12, position: 'relative',
              }}>
                {svc.image ? (
                  <>
                    <img src={svc.image} alt={svc.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{svc.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{svc.category}</div>
                    </div>
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                      {svc.showOnHome && (
                        <div title="Featured in Special Offers" style={{ background: 'var(--c-brand-primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)' }}>
                          HOME
                        </div>
                      )}
                      {svc.isPopular && (
                        <div style={{ background: '#F97316', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Flame size={10}/> Popular
                        </div>
                      )}
                      <Badge status={svc.status} />
                    </div>
                    {svc.cityIds?.length > 0 && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(6,64,129,0.85)', color: 'white', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={10}/> {getCityNames(svc.cityIds)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 28 }}>{svc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{svc.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>{svc.category}</div>
                      {svc.cityIds?.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--c-brand-accent)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10}/> {getCityNames(svc.cityIds)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {svc.showOnHome && (
                        <div title="Featured in Special Offers" style={{ background: 'var(--c-brand-primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)' }}>
                          HOME
                        </div>
                      )}
                      {svc.isPopular && (
                        <div style={{ background: '#F97316', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-full)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Flame size={10}/> Popular
                        </div>
                      )}
                      <Badge status={svc.status} />
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="form-grid form-grid-2" style={{ padding: '14px 20px', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {svc.priceStartsFrom && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-muted)', display: 'block' }}>Starts from</span>}
                    ₹{svc.basePrice.toLocaleString()}
                    {hasCityPrice(svc) && (
                    <span
                      title={`${selectedCityName} has its own price (base is ₹${(svc.baseServicePrice ?? 0).toLocaleString()})`}
                      style={{
                        marginLeft: 5, fontSize: 9, fontWeight: 700, padding: '1px 5px',
                        borderRadius: 4, background: 'var(--c-brand-primary)', color: '#fff',
                        verticalAlign: 'middle', letterSpacing: 0.3,
                      }}
                    >{selectedCityName.toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating</div>
                  <StarRating rating={svc.rating} size={13} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</div>
                  <div style={{ fontWeight: 600 }}>{svc.duration ? `${svc.duration} min` : '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Partners</div>
                  <div style={{ fontWeight: 600 }}>{svc.partners}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bookings</div>
                  <div style={{ fontWeight: 600 }}>{svc.totalBookings.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>This Month</div>
                  <div style={{ fontWeight: 600 }}>{svc.monthlyBookings}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
                  <div style={{ fontWeight: 700, color: 'var(--c-brand-primary)' }}>₹{(svc.revenue / 1000).toFixed(0)}k</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(svc)}>
                  <Edit2 size={13}/> Edit
                </button>
                <button className={`btn btn-sm ${svc.status === 'active' ? 'btn-danger' : 'btn-success'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => toggleStatus(svc.id)}>
                  <Power size={13}/> {svc.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Edit Service Modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit Service — ${editing?.name}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
          </>
        }
      >
        {editing && (
          <div className="form-grid">
            <ImagePicker label="Service Image" value={form.image || ''} onChange={url => setForm(f => ({ ...f, image: url }))} hint="JPG/PNG/WebP · max 2 MB · 128×128 px" exactWidth={128} exactHeight={128} />
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input className="form-input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))}>
                <option value="">Select Category</option>
                {cats.map(c => <option key={c.id} value={String(c.id)}>{c.name ?? c}</option>)}
              </select>
            </div>
            {/* Always rendered, for every category. Hiding it when a category had no
                subcategories yet made the feature look like it only existed for the
                one category that did — there was no way to discover it from here. */}
            <div className="form-group">
              <label className="form-label">Subcategory</label>
              <select className="form-select" value={form.subcategoryId ?? ''} onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))} disabled={!form.categoryId}>
                <option value="">None</option>
                {subcatsForCategory(form.categoryId).map(sub => <option key={sub.id} value={String(sub.id)}>{sub.name}</option>)}
              </select>
              {!!form.categoryId && subcatsForCategory(form.categoryId).length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
                  No subcategories for this category yet — add them under <strong>Subcategories</strong>.
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Base Price (₹)</label>
              <input className="form-input" type="number" value={form.basePrice || ''} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} />
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
                The default price in every city. Set a different price for an individual
                city below — that city only.
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" min="1" value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
                How long this service takes, in minutes. Shown on the app, partner app and website.
              </div>
            </div>
            <ServiceCityEditor
              mappings={editMappings}
              cities={cities}
              basePrice={form.basePrice}
              onToggle={handleCityToggle}
              onAdd={handleCityAdd}
              onRemove={handleCityRemove}
              onPriceChange={handleCityPriceChange}
            />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: form.priceStartsFrom ? 'rgba(6,64,129,0.06)' : 'var(--c-border-light)',
              border: `1px solid ${form.priceStartsFrom ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <input type="checkbox" checked={form.priceStartsFrom ?? false}
                onChange={e => setForm(f => ({ ...f, priceStartsFrom: e.target.checked }))} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Show as "Starts from" price</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Rate-card services whose actual price can vary (hair length, add-ons, etc.) — shows "Starts from ₹{form.basePrice || 'X'}" instead of a flat price on the app and website.</div>
              </div>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: form.isPopular ? 'rgba(249,115,22,0.06)' : 'var(--c-border-light)',
              border: `1px solid ${form.isPopular ? '#F97316' : 'var(--c-border)'}`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <input type="checkbox" checked={form.isPopular ?? false}
                onChange={e => setForm(f => ({ ...f, isPopular: e.target.checked }))} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Show in "Most Booked Services"</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Featured in the app's home screen "Most Booked Services" section.</div>
              </div>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              background: form.showOnHome ? 'rgba(6,64,129,0.06)' : 'var(--c-border-light)',
              border: `1px solid ${form.showOnHome ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <input type="checkbox" checked={form.showOnHome ?? false}
                onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Feature in Special Offers</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Shows this service in the website's home screen "Special Offers" section.</div>
              </div>
            </label>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Describe what this service includes…" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
        )}
      </Modal>

      {/* Add Service Modal */}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add New Service"
        // Same as Manage Categories: a stray backdrop click threw away a half-filled
        // new-service form. Close via the header X or the footer Cancel button.
        dismissOnBackdrop={false}
        dismissOnEscape={false}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveNew}>Add Service</button>
          </>
        }
      >
        <div className="form-grid">
            <ImagePicker label="Service Image" value={form.image || ''} onChange={url => setForm(f => ({ ...f, image: url }))} hint="JPG/PNG/WebP · max 2 MB · 128×128 px" exactWidth={128} exactHeight={128} />
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input className="form-input" placeholder="e.g. Deep Tissue Massage" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value, subcategoryId: '' }))}>
              <option value="">Select Category</option>
              {cats.map(c => <option key={c.id} value={String(c.id)}>{c.name ?? c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <select className="form-select" value={form.subcategoryId ?? ''} onChange={e => setForm(f => ({ ...f, subcategoryId: e.target.value }))} disabled={!form.categoryId}>
              <option value="">None</option>
              {subcatsForCategory(form.categoryId).map(sub => <option key={sub.id} value={String(sub.id)}>{sub.name}</option>)}
            </select>
            {!!form.categoryId && subcatsForCategory(form.categoryId).length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
                No subcategories for this category yet — add them under <strong>Subcategories</strong>.
              </div>
            )}
          </div>
          <CityMultiSelect
            selected={form.cityIds ?? []}
            onChange={val => setForm(f => ({ ...f, cityIds: val }))}
            cities={cities}
            hint="Select cities where this service is available. No selection = available in all cities."
          />
          <div className="form-group">
            <label className="form-label">Base Price (₹) *</label>
            <input className="form-input" type="number" placeholder="500" value={form.basePrice || ''} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (minutes)</label>
            <input className="form-input" type="number" min="1" placeholder="60" value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
              How long this service takes, in minutes. Shown on the app, partner app and website.
            </div>
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: form.priceStartsFrom ? 'rgba(6,64,129,0.06)' : 'var(--c-border-light)',
            border: `1px solid ${form.priceStartsFrom ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
            borderRadius: 8, padding: '10px 12px',
          }}>
            <input type="checkbox" checked={form.priceStartsFrom ?? false}
              onChange={e => setForm(f => ({ ...f, priceStartsFrom: e.target.checked }))} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Show as "Starts from" price</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Rate-card services whose actual price can vary (hair length, add-ons, etc.) — shows "Starts from ₹{form.basePrice || 'X'}" instead of a flat price on the app and website.</div>
            </div>
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: form.isPopular ? 'rgba(249,115,22,0.06)' : 'var(--c-border-light)',
            border: `1px solid ${form.isPopular ? '#F97316' : 'var(--c-border)'}`,
            borderRadius: 8, padding: '10px 12px',
          }}>
            <input type="checkbox" checked={form.isPopular ?? false}
              onChange={e => setForm(f => ({ ...f, isPopular: e.target.checked }))} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Show in "Most Booked Services"</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Featured in the app's home screen "Most Booked Services" section.</div>
            </div>
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: form.showOnHome ? 'rgba(6,64,129,0.06)' : 'var(--c-border-light)',
            border: `1px solid ${form.showOnHome ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
            borderRadius: 8, padding: '10px 12px',
          }}>
            <input type="checkbox" checked={form.showOnHome ?? false}
              onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Feature in Special Offers</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Shows this service in the website's home screen "Special Offers" section.</div>
            </div>
          </label>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} placeholder="Describe what this service includes…" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
        </div>
      </Modal>

      {/* Manage Subcategories Modal — the optional second level under a category
          (Waxing -> Honey / Rica). Separate from Manage Categories so nothing about
          that screen changes. */}
      <Modal
        isOpen={managingSubcats}
        onClose={() => { setMngSubcats(false); setEditingSubcat(null); setSubcatForm({ categoryId: '', name: '' }); }}
        title="Manage Subcategories"
        size="md"
        // Same reasoning as Manage Categories: a stray backdrop click threw away a
        // half-filled form.
        dismissOnBackdrop={false}
        dismissOnEscape={false}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => { setMngSubcats(false); setEditingSubcat(null); setSubcatForm({ categoryId: '', name: '' }); }}>Close</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-grid form-grid-2" style={{ gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={subcatForm.categoryId ?? ''}
                onChange={e => setSubcatForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Select category…</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subcategory Name</label>
              <input
                className="form-input"
                placeholder="e.g. Honey"
                value={subcatForm.name ?? ''}
                onChange={e => setSubcatForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') saveSubcat(); }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={saveSubcat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14}/> {editingSubcat ? 'Save Changes' : 'Add Subcategory'}
            </button>
            {editingSubcat && (
              <button className="btn btn-outline btn-sm" onClick={() => { setEditingSubcat(null); setSubcatForm({ categoryId: subcatForm.categoryId, name: '' }); }}>Cancel</button>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
            {subcats.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                No subcategories yet. Pick a category above and add one — e.g. Honey and Rica under Waxing.
              </div>
            ) : (
              cats.filter(c => subcatsForCategory(c.id).length > 0).map(c => (
                <div key={c.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--c-text-secondary)', marginBottom: 6 }}>{c.name}</div>
                  {subcatsForCategory(c.id).map(sub => {
                    const count = services.filter(s => String(s.subcategoryId) === String(sub.id)).length;
                    return (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--c-border-light)', borderRadius: 'var(--r-sm)', marginBottom: 6 }}>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, opacity: sub.isActive ? 1 : 0.5 }}>
                          {sub.name}
                          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: 'var(--c-text-muted)' }}>
                            {count} service{count === 1 ? '' : 's'}
                          </span>
                          {!sub.isActive && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--c-text-muted)' }}>(hidden)</span>}
                        </span>
                        <button className="btn btn-ghost btn-icon" title={sub.isActive ? 'Hide from app' : 'Show in app'} onClick={() => toggleSubcatActive(sub)}><Power size={14}/></button>
                        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => { setEditingSubcat(sub); setSubcatForm({ categoryId: sub.categoryId, name: sub.name }); }}><Edit2 size={14}/></button>
                        <button className="btn btn-ghost btn-icon" title="Delete" onClick={() => deleteSubcat(sub)}><Trash2 size={14}/></button>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal isOpen={managingCats} onClose={() => { setMngCats(false); setEditingCat(null); setCatForm({ cityIds: [], adminPercent: 20, partnerPercent: 80, gstPercent: 5 }); }} title="Manage Categories" size="md"
        // Closing only via the header X or the footer Close button: this form holds
        // unsaved category edits, and a stray click on the backdrop discarded them.
        dismissOnBackdrop={false}
        dismissOnEscape={false}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
            <button className="btn btn-outline btn-sm" onClick={seedCategories} disabled={seedingCats} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} style={{ animation: seedingCats ? 'spin 1s linear infinite' : 'none' }}/> Seed Default Categories
            </button>
            <button className="btn btn-outline" onClick={() => { setMngCats(false); setEditingCat(null); setCatForm({ cityIds: [], adminPercent: 20, partnerPercent: 80, gstPercent: 5 }); }}>Close</button>
          </div>
        }
      >
        <div>
          {/* Add / Edit form */}
          <div style={{ background: 'var(--c-border-light)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{editingCat ? `Editing: ${editingCat.name}` : 'Add New Category'}</div>
            <ImagePicker
              label="Category Image"
              value={catForm.image || ''}
              onChange={url => setCatForm(f => ({ ...f, image: url }))}
              hint="JPG/PNG/WebP · max 2 MB · 193×193 px"
              exactWidth={193}
              exactHeight={193}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <input className="form-input" placeholder="Category name *" value={catForm.name || ''} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2, minWidth: 120 }} />
              <input className="form-input" placeholder="Description (optional)" value={catForm.description || ''} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} style={{ flex: 3, minWidth: 140 }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <CityMultiSelect
                selected={catForm.cityIds ?? []}
                onChange={val => setCatForm(f => ({ ...f, cityIds: val }))}
                cities={cities}
                hint="No selection = available in all cities."
              />
            </div>
            <RevenueSplitFields form={catForm} setForm={setCatForm} />
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 10,
              background: catForm.showOnHome ? 'rgba(6,64,129,0.06)' : 'var(--c-border-light)',
              border: `1px solid ${catForm.showOnHome ? 'var(--c-brand-primary)' : 'var(--c-border)'}`,
              borderRadius: 8, padding: '10px 12px',
            }}>
              <input type="checkbox" checked={catForm.showOnHome ?? false}
                onChange={e => setCatForm(f => ({ ...f, showOnHome: e.target.checked }))} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Show on Home Screen</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Feature this category on the app header and website's home page</div>
              </div>
            </label>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={saveCat} style={{ whiteSpace: 'nowrap' }}>{editingCat ? 'Update' : 'Add'}</button>
              {editingCat && <button className="btn btn-outline btn-sm" onClick={() => { setEditingCat(null); setCatForm({ cityIds: [], adminPercent: 20, partnerPercent: 80, gstPercent: 5 }); }}>Cancel</button>}
            </div>
          </div>

          {/* Categories list */}
          {cats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--c-text-secondary)', fontSize: 14 }}>
              No categories yet. Add one above or click "Seed Default Categories".
            </div>
          ) : (
            <div className="form-hint" style={{ marginBottom: 8 }}>Drag <GripVertical size={11} style={{ verticalAlign: -2 }} /> to reorder — this sets the display order on the app and website.</div>
          )}
          {cats.length > 0 && (
          <DragDropContext onDragEnd={handleCatDragEnd}>
            <Droppable droppableId="categories-list">
              {(dropProvided) => (
                <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                  {cats.map((c, index) => {
            const isActive = c.isActive ?? true;
            return (
              <Draggable key={c._id ?? c.id} draggableId={String(c._id ?? c.id)} index={index}>
                {(dragProvided, dragSnapshot) => (
              <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--c-border-light)', opacity: isActive ? 1 : 0.6, background: dragSnapshot.isDragging ? 'var(--c-border-light)' : 'transparent', ...dragProvided.draggableProps.style }}>
                <span {...dragProvided.dragHandleProps} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--c-text-muted)', display: 'flex', flexShrink: 0 }}>
                  <GripVertical size={16} />
                </span>
                {c.image ? (
                  <img src={c.image} alt={c.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    🗂
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                      background: isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
                      color: isActive ? '#16a34a' : '#dc2626',
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}>
                      {isActive ? <CheckCircle size={9}/> : <XCircle size={9}/>}
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    {c.showOnHome && (
                      <span title="Featured on home screen" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-brand-primary)', background: 'rgba(6,64,129,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                        HOME
                      </span>
                    )}
                  </div>
                  {c.description && <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
                  {(c.cityIds ?? []).length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--c-brand-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <MapPin size={10}/> {getCityNames(c.cityIds)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: 'var(--c-text-secondary)' }}>
                    <span style={{ color: 'var(--c-brand-teal-mid)', fontWeight: 600 }}>Admin {parseFloat(c.adminPercent ?? 20)}%</span>
                    <span>·</span>
                    <span style={{ color: '#C49738', fontWeight: 600 }}>Partner {parseFloat(c.partnerPercent ?? 80)}%</span>
                    <span>·</span>
                    <span>GST {parseFloat(c.gstPercent ?? 5)}%</span>
                  </div>
                </div>
                <button
                  className={`btn btn-ghost btn-icon`}
                  title={isActive ? 'Deactivate' : 'Activate'}
                  style={{ color: isActive ? 'var(--c-danger)' : 'var(--c-success, #16a34a)' }}
                  onClick={() => toggleCatStatus(c)}
                >
                  <Power size={14}/>
                </button>
                <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => { setEditingCat(c); setCatForm({ name: c.name, description: c.description || '', image: c.image || '', cityIds: c.cityIds ?? [], adminPercent: parseFloat(c.adminPercent ?? 20), partnerPercent: parseFloat(c.partnerPercent ?? 80), gstPercent: parseFloat(c.gstPercent ?? 5), showOnHome: c.showOnHome ?? false }); }}><Edit2 size={14}/></button>
                <button className="btn btn-ghost btn-icon" title="Delete" style={{ color: 'var(--c-danger)' }} onClick={() => deleteCat(c._id ?? c.id)}><Trash2 size={14}/></button>
              </div>
                )}
              </Draggable>
            );
                  })}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          )}
        </div>
      </Modal>
    </div>
  );
}
