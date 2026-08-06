import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Monitor, Smartphone } from 'lucide-react';
import Modal from '../components/common/Modal';
import ImageUploader from '../components/common/ImageUploader';
import { useAuth } from '../context/AuthContext';
import { useBanners } from '../hooks/useBanners';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const TYPE_CONFIG = {
  top:   { label: 'Top Banner',   desc: 'Large promotional card at the top of the home screen', icon: <Monitor size={16}/> },
  promo: { label: 'Promo Card',   desc: 'Small card in the bottom promo section (2 shown side-by-side)', icon: <Smartphone size={16}/> },
};

const EMPTY_FORM = {
  type: 'top', title: '', subtitle: '', description: '',
  image: '', gradientStart: '#1a5c4a', gradientEnd: '#022723',
  buttonText: 'Book Now', targetScreen: '', targetParam: '', isActive: true, sortOrder: 0,
};

export default function Banners() {
  const { showToast } = useAuth();
  const { fetchList, create, update, remove } = useBanners();
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadBanners = () => {
    fetchList().then(res => { if (res.ok) setBanners(res.data?.data ?? []); });
  };

  useEffect(() => { loadBanners(); }, []);
  useAutoRefresh(loadBanners);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saveNew = async () => {
    if (!form.title) { showToast('Title is required.', 'danger'); return; }
    const res = await create(form);
    if (res.ok) {
      setBanners(p => [...p, res.data?.data ?? form]);
      showToast('Banner created!', 'success');
      setAdding(false);
    } else showToast(res.error ?? 'Failed to create banner.', 'danger');
  };

  const saveEdit = async () => {
    if (!form.title) { showToast('Title is required.', 'danger'); return; }
    const res = await update(editing.id, form);
    if (res.ok) {
      setBanners(p => p.map(b => b.id === editing.id ? { ...b, ...form } : b));
      showToast('Banner updated!', 'success');
      setEditing(null);
    } else showToast(res.error ?? 'Failed to update banner.', 'danger');
  };

  const toggleActive = async (banner) => {
    const res = await update(banner.id, { isActive: !banner.isActive });
    if (res.ok) {
      setBanners(p => p.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
      showToast(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}.`, 'success');
    } else showToast(res.error ?? 'Failed.', 'danger');
  };

  const deleteBanner = async (id) => {
    const res = await remove(id);
    if (res.ok) {
      setBanners(p => p.filter(b => b.id !== id));
      showToast('Banner deleted.', 'danger');
    } else showToast(res.error ?? 'Failed to delete.', 'danger');
  };

  const openEdit = (b) => { setEditing(b); setForm({ ...EMPTY_FORM, ...b }); };
  const openAdd  = () => { setAdding(true); setForm(EMPTY_FORM); };

  const topBanners  = banners.filter(b => b.type === 'top');
  const promoBanners = banners.filter(b => b.type === 'promo');

  const BannerForm = () => (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">Banner Type *</label>
        <select className="form-select" value={form.type} onChange={e => f('type', e.target.value)}>
          <option value="top">Top Banner — large card at top of home screen</option>
          <option value="promo">Promo Card — bottom side-by-side cards</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Image</label>
        <ImageUploader value={form.image} onChange={v => f('image', v)} />
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Therapeutic" />
        </div>
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <input className="form-input" value={form.subtitle} onChange={e => f('subtitle', e.target.value)} placeholder="e.g. MASSAGES" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={2} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Short description shown on the banner" style={{ resize: 'vertical' }} />
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Gradient Start</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.gradientStart || '#1a5c4a'} onChange={e => f('gradientStart', e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--c-border)', cursor: 'pointer' }} />
            <input className="form-input" value={form.gradientStart} onChange={e => f('gradientStart', e.target.value)} placeholder="#1a5c4a" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Gradient End</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.gradientEnd || '#022723'} onChange={e => f('gradientEnd', e.target.value)} style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--c-border)', cursor: 'pointer' }} />
            <input className="form-input" value={form.gradientEnd} onChange={e => f('gradientEnd', e.target.value)} placeholder="#022723" />
          </div>
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Button Text</label>
          <input className="form-input" value={form.buttonText} onChange={e => f('buttonText', e.target.value)} placeholder="Book Now" />
        </div>
        <div className="form-group">
          <label className="form-label">Sort Order</label>
          <input className="form-input" type="number" value={form.sortOrder} onChange={e => f('sortOrder', +e.target.value)} placeholder="0" />
          <span className="form-hint">Lower numbers appear first</span>
        </div>
      </div>
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Target Screen</label>
          <select className="form-select" value={form.targetScreen} onChange={e => f('targetScreen', e.target.value)}>
            <option value="">None</option>
            <option value="ServiceListing">Service Listing</option>
            <option value="Coupons">Coupons</option>
            <option value="Profile">Profile</option>
            <option value="CustomPackages">Custom Packages CTA (home screen)</option>
            <option value="Combos">Combos CTA (home screen)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Target Parameter</label>
          <input className="form-input" value={form.targetParam} onChange={e => f('targetParam', e.target.value)} placeholder="e.g. Massage" />
          <span className="form-hint">Category name or screen param</span>
        </div>
      </div>
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} />
          <span className="form-label" style={{ margin: 0 }}>Active (visible on app)</span>
        </label>
      </div>
    </div>
  );

  const BannerCard = ({ banner }) => (
    <div style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', opacity: banner.isActive ? 1 : 0.55 }}>
      <div style={{
        height: 90, background: `linear-gradient(90deg, ${banner.gradientStart || '#1a5c4a'}, ${banner.gradientEnd || '#022723'})`,
        position: 'relative', display: 'flex', alignItems: 'flex-end',
      }}>
        {banner.image && <img src={banner.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
        <div style={{ position: 'relative', padding: '8px 14px', color: 'white' }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{banner.subtitle}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{banner.title}</div>
        </div>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          <span style={{ background: banner.isActive ? 'var(--c-success-bg)' : 'var(--c-border-light)', color: banner.isActive ? 'var(--c-success)' : 'var(--c-text-muted)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
            {banner.isActive ? 'Live' : 'Off'}
          </span>
        </div>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {banner.targetScreen ? `→ ${banner.targetScreen}${banner.targetParam ? ` (${banner.targetParam})` : ''}` : 'No target'}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => toggleActive(banner)} title={banner.isActive ? 'Deactivate' : 'Activate'}>
            {banner.isActive ? <ToggleRight size={16} style={{ color: 'var(--c-success)' }}/> : <ToggleLeft size={16}/>}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(banner)}><Edit2 size={14}/></button>
          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--c-danger)' }} onClick={() => deleteBanner(banner.id)}><Trash2 size={14}/></button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="form-grid form-grid-2" style={{ gap: 24 }}>
        {/* Top Banners */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Monitor size={16}/> Top Banners</div>
              <div className="card-subtitle">Large promotional card at the top of home screen</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14}/> Add
            </button>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topBanners.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 14 }}>
                No top banners yet. Click Add to create one.
              </div>
            ) : topBanners.map(b => <BannerCard key={b.id} banner={b} />)}
          </div>
        </div>

        {/* Promo Cards */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Smartphone size={16}/> Promo Cards</div>
              <div className="card-subtitle">Side-by-side cards shown at the bottom of home screen</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setForm({ ...EMPTY_FORM, type: 'promo' }); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14}/> Add
            </button>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {promoBanners.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 14 }}>
                No promo cards yet. Click Add to create one.
              </div>
            ) : promoBanners.map(b => <BannerCard key={b.id} banner={b} />)}
          </div>
        </div>
      </div>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add Banner"
        footer={<><button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={saveNew}>Create Banner</button></>}>
        <BannerForm />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit Banner — ${editing?.title}`}
        footer={<><button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save Changes</button></>}>
        {editing && <BannerForm />}
      </Modal>
    </div>
  );
}
