import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, Power, FolderTree, ChevronRight, Search, Layers, GripVertical, RefreshCw, ListOrdered } from 'lucide-react';
import Modal from '../components/common/Modal';
import RevenueSplitFields, { revenueSplitPayload } from '../components/common/RevenueSplitFields';
// Reused from the Services page rather than duplicated, so a category's image picker
// and city selector behave identically on both screens.
import { ImagePicker, CityMultiSelect, DEFAULT_CATEGORIES } from './Services';
import { useAuth } from '../context/AuthContext';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import api from '../services/api';

const CATEGORIES_URL    = '/api/v1/admin/services/categories';
const SUBCATEGORIES_URL = '/api/v1/admin/services/subcategories';
const SERVICES_URL      = '/api/v1/admin/services';

const idOf = (row) => String(row?._id ?? row?.id ?? '');

/**
 * Categories & Subcategories — a dedicated two-pane browser for the service taxonomy.
 *
 * Categories on the left, the selected category's subcategories on the right, so the
 * parent of every subcategory is never ambiguous.
 *
 * This is the full home for the taxonomy: image, city availability, revenue split,
 * home-screen feature flag, drag-to-reorder and seed-defaults all live here, so nothing
 * has to be done from the Services page. The Manage Categories / Manage Subcategories
 * modals over there are deliberately left working — this page is an additional, clearer
 * way in, not a replacement.
 */
export default function Catalog() {
  const { showToast } = useAuth();
  const { cityId, cities } = useCityFilter();

  const [cats, setCats] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [search, setSearch] = useState('');

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({});
  const [catSaving, setCatSaving] = useState(false);

  // Subcategory modal
  const [subModal, setSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState({});
  const [subSaving, setSubSaving] = useState(false);

  const [reordering, setReordering] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // The header's city switcher narrows this page the same way it narrows Services:
      // only categories/services offered in that city. No city selected = everything.
      const cityParams = cityId ? { cityId } : {};
      const [c, s, sv] = await Promise.all([
        api.get(CATEGORIES_URL, { params: { limit: 1000, ...cityParams } }),
        api.get(SUBCATEGORIES_URL),
        api.get(SERVICES_URL, { params: { limit: 1000, ...cityParams } }),
      ]);
      setCats(c.data?.data?.data ?? c.data?.data ?? []);
      setSubcats(s.data?.data ?? []);
      setServices(sv.data?.data?.data ?? sv.data?.data ?? []);
    } catch {
      // Leave whatever is on screen rather than blanking the page on a transient error.
    }
    setLoading(false);
  }, [cityId]);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true));

  // Land on the first category so the right pane is never pointlessly empty on arrival,
  // and drop a selection that the current city filter has removed from the list.
  useEffect(() => {
    if (cats.length === 0) return;
    const stillVisible = cats.some(c => idOf(c) === String(selectedCatId));
    if (selectedCatId == null || !stillVisible) setSelectedCatId(idOf(cats[0]));
  }, [cats, selectedCatId]);

  const subsOf   = (catId) => subcats.filter(s => String(s.categoryId) === String(catId));
  const svcCount = (catId) => services.filter(s => String(s.categoryId) === String(catId)).length;
  const svcCountForSub = (subId) => services.filter(s => String(s.subcategoryId) === String(subId)).length;

  const selectedCat = cats.find(c => idOf(c) === String(selectedCatId)) ?? null;
  const visibleCats = cats.filter(c =>
    !search || (c.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ---------- Categories ----------
  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', image: '', cityIds: [], showOnHome: false, isActive: true, adminPercent: 20, partnerPercent: 80, gstPercent: 5 });
    setCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name ?? '',
      description: cat.description ?? '',
      image: cat.image ?? '',
      showOnHome: cat.showOnHome ?? false,
      isActive: cat.isActive !== false,
      sortOrder: cat.sortOrder ?? 0,
      adminPercent: cat.adminPercent ?? 20,
      partnerPercent: cat.partnerPercent ?? 80,
      gstPercent: cat.gstPercent ?? 5,
      cityIds: cat.cityIds ?? [],
    });
    setCatModal(true);
  };

  const saveCat = async () => {
    if (!catForm.name?.trim()) { showToast('Category name is required.', 'danger'); return; }
    setCatSaving(true);
    const payload = {
      name: catForm.name.trim(),
      description: catForm.description ?? '',
      image: catForm.image ?? '',
      showOnHome: catForm.showOnHome ?? false,
      isActive: catForm.isActive !== false,
      cityIds: catForm.cityIds ?? [],
      ...revenueSplitPayload(catForm),
      ...(catForm.sortOrder != null ? { sortOrder: Number(catForm.sortOrder) } : {}),
    };
    try {
      if (editingCat) {
        await api.put(`${CATEGORIES_URL}/${idOf(editingCat)}`, payload);
        showToast('Category updated.', 'success');
      } else {
        const res = await api.post(CATEGORIES_URL, payload);
        showToast('Category added.', 'success');
        const created = res.data?.data;
        if (created) setSelectedCatId(idOf(created));
      }
      setCatModal(false); setEditingCat(null);
      await load(true);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to save category.', 'danger');
    }
    setCatSaving(false);
  };

  const toggleCatActive = async (cat) => {
    try {
      // PUT on categories replaces the row, so the unchanged fields have to ride along
      // — sending only isActive would blank the name and the revenue split.
      await api.put(`${CATEGORIES_URL}/${idOf(cat)}`, {
        name: cat.name,
        description: cat.description ?? '',
        image: cat.image ?? '',
        showOnHome: cat.showOnHome ?? false,
        isActive: !(cat.isActive !== false),
        cityIds: cat.cityIds ?? [],
        sortOrder: cat.sortOrder ?? 0,
        ...revenueSplitPayload(cat),
      });
      await load(true);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to update category.', 'danger');
    }
  };

  const deleteCat = async (cat) => {
    const n = subsOf(idOf(cat)).length;
    const warn = n > 0 ? `\n\nIts ${n} subcategor${n === 1 ? 'y' : 'ies'} will be removed too.` : '';
    if (!window.confirm(`Delete category "${cat.name}"?${warn}`)) return;
    try {
      await api.delete(`${CATEGORIES_URL}/${idOf(cat)}`);
      showToast('Category deleted.', 'danger');
      if (idOf(cat) === String(selectedCatId)) setSelectedCatId(null);
      await load(true);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to delete category.', 'danger');
    }
  };

  // Drag-to-reorder decides the order of the category strip in the customer app.
  const onCatDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(cats);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setCats(next); // optimistic — reloaded from the server if the save fails
    try {
      await api.patch(`${CATEGORIES_URL}/reorder`, { order: next.map(idOf) });
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to save category order.', 'danger');
      await load(true);
    }
  };

  const seedDefaults = async () => {
    setSeeding(true);
    let added = 0;
    for (const name of DEFAULT_CATEGORIES) {
      if (cats.some(c => c.name === name)) continue;
      try { await api.post(CATEGORIES_URL, { name, cityIds: [] }); added++; } catch { /* keep going */ }
    }
    showToast(added > 0 ? `Added ${added} default categories.` : 'All default categories already exist.', added > 0 ? 'success' : 'info');
    setSeeding(false);
    await load(true);
  };

  // ---------- Subcategories ----------
  const openNewSub = () => {
    if (!selectedCat) return;
    setEditingSub(null);
    setSubForm({ categoryId: idOf(selectedCat), name: '', description: '', image: '', isActive: true });
    setSubModal(true);
  };

  const openEditSub = (sub) => {
    setEditingSub(sub);
    setSubForm({
      categoryId: String(sub.categoryId),
      name: sub.name ?? '',
      description: sub.description ?? '',
      image: sub.image ?? '',
      isActive: sub.isActive !== false,
    });
    setSubModal(true);
  };

  const saveSub = async () => {
    if (!subForm.categoryId) { showToast('Pick a parent category.', 'danger'); return; }
    if (!subForm.name?.trim()) { showToast('Subcategory name is required.', 'danger'); return; }
    setSubSaving(true);
    const payload = {
      categoryId: Number(subForm.categoryId),
      name: subForm.name.trim(),
      description: subForm.description ?? '',
      image: subForm.image ?? '',
      isActive: subForm.isActive !== false,
    };
    try {
      if (editingSub) {
        await api.patch(`${SUBCATEGORIES_URL}/${editingSub.id}`, payload);
        showToast('Subcategory updated.', 'success');
      } else {
        await api.post(SUBCATEGORIES_URL, payload);
        showToast('Subcategory added.', 'success');
      }
      // Follow the subcategory if it was reparented, so it doesn't vanish from view.
      setSelectedCatId(String(subForm.categoryId));
      setSubModal(false); setEditingSub(null);
      await load(true);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to save subcategory.', 'danger');
    }
    setSubSaving(false);
  };

  const toggleSubActive = async (sub) => {
    try {
      await api.patch(`${SUBCATEGORIES_URL}/${sub.id}`, { isActive: !(sub.isActive !== false) });
      await load(true);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to update subcategory.', 'danger');
    }
  };

  const deleteSub = async (sub) => {
    const n = svcCountForSub(sub.id);
    const warn = n > 0
      ? `\n\nIts ${n} service${n === 1 ? '' : 's'} stay, but lose this subcategory.`
      : '';
    if (!window.confirm(`Delete subcategory "${sub.name}"?${warn}`)) return;
    try {
      await api.delete(`${SUBCATEGORIES_URL}/${sub.id}`);
      showToast('Subcategory deleted.', 'danger');
      await load(true);
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Failed to delete.', 'danger');
    }
  };

  const selectedSubs = selectedCat ? subsOf(idOf(selectedCat)) : [];

  const Pill = ({ active }) => (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap',
      background: active ? '#dcfce7' : 'var(--c-border)',
      color: active ? '#166534' : 'var(--c-text-muted)',
    }}>
      {active ? 'Active' : 'Hidden'}
    </span>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories &amp; Subcategories</h1>
          <p className="page-subtitle">
            {cats.length} categories · {subcats.length} subcategories — pick a category to see what sits under it
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={seedDefaults} disabled={seeding} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} style={{ animation: seeding ? 'spin 1s linear infinite' : 'none' }} /> Seed Defaults
          </button>
          <button className={`btn btn-sm ${reordering ? 'btn-primary' : 'btn-outline'}`} onClick={() => { setSearch(''); setReordering(r => !r); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ListOrdered size={13} /> {reordering ? 'Done' : 'Reorder'}
          </button>
          <button className="btn btn-primary" onClick={openNewCat}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--c-text-muted)' }}>Loading…</div>
      ) : cats.length === 0 ? (
        <div className="empty-state">
          <FolderTree size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>No categories yet. Add your first one.</p>
          <button className="btn btn-primary" onClick={openNewCat} style={{ marginTop: 12 }}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      ) : (
        // Two panes side by side on desktop, stacked on narrow screens. minmax(0,·) so a
        // long category name can't blow the column out instead of ellipsing.
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}
             className="catalog-grid">

          {/* ── Left: categories ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--c-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 30, height: 34, fontSize: 13 }}
                  placeholder="Search categories…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {reordering ? (
              // Reorder mode drags the real `cats` order (not the filtered view), so the
              // saved order can't be a rearrangement of a partial list.
              <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
                <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--c-text-muted)', borderBottom: '1px solid var(--c-border-light)' }}>
                  Drag to set the order customers see.
                </div>
                <DragDropContext onDragEnd={onCatDragEnd}>
                  <Droppable droppableId="catalog-categories">
                    {(dp) => (
                      <div ref={dp.innerRef} {...dp.droppableProps}>
                        {cats.map((cat, i) => (
                          <Draggable key={idOf(cat)} draggableId={idOf(cat)} index={i}>
                            {(dr, snap) => (
                              <div ref={dr.innerRef} {...dr.draggableProps} {...dr.dragHandleProps}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '11px 14px', borderBottom: '1px solid var(--c-border-light)',
                                  background: snap.isDragging ? 'var(--c-border-light)' : 'transparent',
                                  ...dr.draggableProps.style,
                                }}>
                                <GripVertical size={15} style={{ color: 'var(--c-text-muted)', flexShrink: 0 }} />
                                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{i + 1}</span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {dp.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            ) : (
            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {visibleCats.length === 0 ? (
                <div style={{ padding: 20, fontSize: 13, color: 'var(--c-text-muted)' }}>No categories match “{search}”.</div>
              ) : visibleCats.map(cat => {
                const selected = idOf(cat) === String(selectedCatId);
                const nSubs = subsOf(idOf(cat)).length;
                return (
                  <div
                    key={idOf(cat)}
                    onClick={() => setSelectedCatId(idOf(cat))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 14px', cursor: 'pointer',
                      borderBottom: '1px solid var(--c-border-light)',
                      background: selected ? 'var(--c-border-light)' : 'transparent',
                      borderLeft: `3px solid ${selected ? 'var(--c-brand-primary)' : 'transparent'}`,
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: selected ? 700 : 600, fontSize: 14,
                        opacity: cat.isActive === false ? 0.55 : 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>
                        {nSubs} subcategor{nSubs === 1 ? 'y' : 'ies'} · {svcCount(idOf(cat))} service{svcCount(idOf(cat)) === 1 ? '' : 's'}
                      </div>
                    </div>
                    {cat.isActive === false && <Pill active={false} />}
                    <ChevronRight size={15} style={{ color: 'var(--c-text-muted)', flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* ── Right: the selected category's subcategories ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {!selectedCat ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>
                Pick a category on the left.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--c-border)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    {/* Breadcrumb — the parent is stated outright, so a subcategory's
                        owner is never in doubt. */}
                    <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 3 }}>
                      Categories <ChevronRight size={10} style={{ verticalAlign: -1 }} /> <strong style={{ color: 'var(--c-text-secondary)' }}>{selectedCat.name}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{selectedCat.name}</h2>
                      <Pill active={selectedCat.isActive !== false} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditCat(selectedCat)} title="Edit category">
                      <Edit2 size={13} /> Edit
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleCatActive(selectedCat)} title={selectedCat.isActive !== false ? 'Hide from app' : 'Show in app'}>
                      <Power size={13} /> {selectedCat.isActive !== false ? 'Hide' : 'Show'}
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--c-danger)' }} onClick={() => deleteCat(selectedCat)} title="Delete category">
                      <Trash2 size={13} />
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={openNewSub}>
                      <Plus size={14} /> Add Subcategory
                    </button>
                  </div>
                </div>

                <div style={{ padding: 16 }}>
                  {selectedSubs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--c-text-muted)' }}>
                      <Layers size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                      <p style={{ fontSize: 13, margin: '0 0 4px' }}>
                        No subcategories under <strong>{selectedCat.name}</strong> yet.
                      </p>
                      <p style={{ fontSize: 12, margin: '0 0 12px' }}>
                        Customers see the full category list until you add some.
                      </p>
                      <button className="btn btn-primary btn-sm" onClick={openNewSub}>
                        <Plus size={14} /> Add Subcategory
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedSubs.map(sub => {
                        const n = svcCountForSub(sub.id);
                        return (
                          <div key={sub.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '12px 14px', borderRadius: 'var(--r-md)',
                            background: 'var(--c-border-light)',
                          }}>
                            {sub.image ? (
                              <img src={sub.image} alt={sub.name}
                                   style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 8, flexShrink: 0, opacity: sub.isActive === false ? 0.5 : 1 }} />
                            ) : (
                              // Placeholder keeps every row the same height whether or not
                              // an image has been uploaded.
                              <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: 'var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Layers size={15} style={{ color: 'var(--c-text-muted)', opacity: 0.6 }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 14, opacity: sub.isActive === false ? 0.55 : 1 }}>
                                  {sub.name}
                                </span>
                                {sub.isActive === false && <Pill active={false} />}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 3 }}>
                                {selectedCat.name} · {n} service{n === 1 ? '' : 's'}
                                {n === 0 && ' — assign services on the Services page'}
                              </div>
                            </div>
                            <button className="btn btn-ghost btn-icon" title={sub.isActive === false ? 'Show in app' : 'Hide from app'} onClick={() => toggleSubActive(sub)}><Power size={14} /></button>
                            <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => openEditSub(sub)}><Edit2 size={14} /></button>
                            <button className="btn btn-ghost btn-icon" style={{ color: 'var(--c-danger)' }} title="Delete" onClick={() => deleteSub(sub)}><Trash2 size={14} /></button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Category modal ── */}
      <Modal
        isOpen={catModal}
        onClose={() => { setCatModal(false); setEditingCat(null); }}
        title={editingCat ? `Edit Category — ${editingCat.name}` : 'Add Category'}
        size="md"
        dismissOnBackdrop={false}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => { setCatModal(false); setEditingCat(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveCat} disabled={catSaving}>
              {catSaving ? 'Saving…' : editingCat ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        }
      >
        <ImagePicker
          label="Category Image"
          value={catForm.image || ''}
          onChange={url => setCatForm(f => ({ ...f, image: url }))}
          hint="JPG/PNG/WebP · max 2 MB · 193×193 px"
          exactWidth={193}
          exactHeight={193}
        />
        <div className="form-group">
          <label className="form-label">Category Name *</label>
          <input className="form-input" placeholder="e.g. Waxing" value={catForm.name ?? ''}
                 onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                 onKeyDown={e => { if (e.key === 'Enter') saveCat(); }} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Optional" value={catForm.description ?? ''}
                 onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <CityMultiSelect
          selected={catForm.cityIds ?? []}
          onChange={val => setCatForm(f => ({ ...f, cityIds: val }))}
          cities={cities}
          hint="Cities where this category appears. No selection = all cities."
        />
        <RevenueSplitFields form={catForm} setForm={setCatForm} />
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={catForm.showOnHome ?? false}
                   onChange={e => setCatForm(f => ({ ...f, showOnHome: e.target.checked }))} />
            Feature on the app home screen
          </label>
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={catForm.isActive !== false}
                   onChange={e => setCatForm(f => ({ ...f, isActive: e.target.checked }))} />
            Visible in the customer app
          </label>
        </div>
      </Modal>

      {/* ── Subcategory modal ── */}
      <Modal
        isOpen={subModal}
        onClose={() => { setSubModal(false); setEditingSub(null); }}
        title={editingSub ? `Edit Subcategory — ${editingSub.name}` : 'Add Subcategory'}
        size="md"
        dismissOnBackdrop={false}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => { setSubModal(false); setEditingSub(null); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveSub} disabled={subSaving}>
              {subSaving ? 'Saving…' : editingSub ? 'Save Changes' : 'Add Subcategory'}
            </button>
          </div>
        }
      >
        {/* No exactWidth/exactHeight: the customer app doesn't render this yet, so
            there's no size spec to hold uploads to. Add one here when it does. */}
        <ImagePicker
          label="Subcategory Image"
          value={subForm.image || ''}
          onChange={url => setSubForm(f => ({ ...f, image: url }))}
          hint="JPG/PNG/WebP · max 2 MB · stored for later use, not shown in the app yet"
        />
        <div className="form-group">
          <label className="form-label">Parent Category *</label>
          <select className="form-select" value={subForm.categoryId ?? ''}
                  onChange={e => setSubForm(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select category…</option>
            {cats.map(c => <option key={idOf(c)} value={idOf(c)}>{c.name}</option>)}
          </select>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
            Changing this moves the subcategory to another category.
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Subcategory Name *</label>
          <input className="form-input" placeholder="e.g. Honey" value={subForm.name ?? ''}
                 onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
                 onKeyDown={e => { if (e.key === 'Enter') saveSub(); }} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Optional" value={subForm.description ?? ''}
                 onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={subForm.isActive !== false}
                   onChange={e => setSubForm(f => ({ ...f, isActive: e.target.checked }))} />
            Visible in the customer app
          </label>
        </div>
      </Modal>

      {/* One pane per row once there isn't room for two side by side. */}
      <style>{`
        @media (max-width: 860px) {
          .catalog-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
