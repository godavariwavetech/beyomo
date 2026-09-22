import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../components/common/Modal';
import ImageUploader from '../components/common/ImageUploader';
import { useAuth } from '../context/AuthContext';
import { useBanners } from '../hooks/useBanners';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

// Fixed slots — exactly one active image per slot, used across the website and app.
const SLOTS = [
  { type: 'hero',           label: 'Homepage Hero',          desc: 'Large banner at the top of the website homepage',                                                                    w: 1320, h: 510 },
  { type: 'custom_package', label: 'Custom Package CTA',     desc: '"Make Your Own Package" card on the app home screen, website homepage, and Products page',                           w: 384,  h: 175 },
  { type: 'combo',          label: 'Combo CTA',              desc: '"Combo Offers" card on the app home screen, website homepage, and Products page',                                    w: 384,  h: 175 },
  { type: 'why_beyomo',     label: 'Why Beyomo?',            desc: 'Section image on the website homepage — "Why Beyomo?" promo card',                                                   w: 628,  h: 355 },
  { type: 'book_steps',     label: 'Book in 3 Easy Steps',   desc: 'Section image on the website homepage — "Book in 3 Easy Steps" promo card',                                         w: 628,  h: 355 },
];

export default function Banners() {
  const { showToast } = useAuth();
  const { fetchList, create, update } = useBanners();
  const [banners, setBanners] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form, setForm] = useState({ image: '', image2: '', image3: '', isActive: true });

  const loadBanners = () => {
    fetchList().then(res => { if (res.ok) setBanners(res.data?.data ?? []); });
  };

  useEffect(() => { loadBanners(); }, []);
  useAutoRefresh(loadBanners);

  const bannerForSlot = (type) => banners.find(b => b.type === type);

  const openSlot = (type) => {
    const existing = bannerForSlot(type);
    setForm({ image: existing?.image ?? '', image2: existing?.image2 ?? '', image3: existing?.image3 ?? '', isActive: existing?.isActive ?? true });
    setEditingSlot(type);
  };

  const save = async () => {
    if (!form.image) { showToast('Please upload a main image.', 'danger'); return; }
    const existing = bannerForSlot(editingSlot);
    const res = existing
      ? await update(existing.id, { image: form.image, image2: form.image2 || null, image3: form.image3 || null, isActive: form.isActive })
      : await create({ type: editingSlot, image: form.image, image2: form.image2 || null, image3: form.image3 || null, isActive: form.isActive });
    if (res.ok) {
      showToast('Banner saved!', 'success');
      setEditingSlot(null);
      loadBanners();
    } else showToast(res.error ?? 'Failed to save banner.', 'danger');
  };

  const toggleActive = async (slot) => {
    const existing = bannerForSlot(slot.type);
    if (!existing) return;
    const res = await update(existing.id, { isActive: !existing.isActive });
    if (res.ok) {
      showToast(`Banner ${!existing.isActive ? 'activated' : 'deactivated'}.`, 'success');
      loadBanners();
    } else showToast(res.error ?? 'Failed.', 'danger');
  };

  return (
    <div>
      <div className="form-grid form-grid-2" style={{ gap: 20 }}>
        {SLOTS.map(slot => {
          const banner = bannerForSlot(slot.type);
          return (
            <div key={slot.type} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: 140, background: 'var(--c-border-light)', position: 'relative' }}>
                {banner?.image ? (
                  // Capped at the slot's own required upload resolution (enforced by
                  // ImageUploader's exactWidth/exactHeight below) so a slot smaller than
                  // this card — custom_package/combo are 384x175 vs. a ~550px-wide card —
                  // is centered at its native size instead of being stretched past its
                  // real resolution, which is what was causing the visible blur. Slots at
                  // or above the card's size (hero, why_beyomo, book_steps) render exactly
                  // as before, since the cap never becomes the limiting dimension for them.
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={banner.image}
                      alt={slot.label}
                      style={{ width: '100%', height: '100%', maxWidth: slot.w, maxHeight: slot.h, objectFit: 'cover', opacity: banner.isActive ? 1 : 0.4 }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)' }}>
                    <ImageIcon size={28} />
                  </div>
                )}
                <span style={{
                  position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)',
                  background: banner?.isActive ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                  color: banner?.isActive ? 'var(--c-success)' : 'var(--c-text-muted)',
                }}>
                  {banner?.isActive ? 'Live' : banner ? 'Off' : 'Not set'}
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="card-title" style={{ fontSize: 14 }}>{slot.label}</div>
                <div className="card-subtitle" style={{ fontSize: 12 }}>{slot.desc}</div>
              </div>
              <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openSlot(slot.type)}>
                  {banner ? 'Change Image' : 'Upload Image'}
                </button>
                {banner && (
                  <button className="btn btn-ghost btn-icon" onClick={() => toggleActive(slot)} title={banner.isActive ? 'Deactivate' : 'Activate'}>
                    {banner.isActive ? <ToggleRight size={16} style={{ color: 'var(--c-success)' }} /> : <ToggleLeft size={16} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!editingSlot}
        onClose={() => setEditingSlot(null)}
        title={`${SLOTS.find(s => s.type === editingSlot)?.label ?? ''} Image`}
        footer={<><button className="btn btn-outline" onClick={() => setEditingSlot(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}
      >
      <div className="form-grid">
          {(() => {
            const slot = SLOTS.find(s => s.type === editingSlot);
            return (
              <div className="form-group">
                <label className="form-label">Banner Image <span style={{ fontWeight: 400, color: 'var(--c-text-muted)', fontSize: 12 }}>JPG/PNG/WebP · max 2 MB · {slot?.w}×{slot?.h} px</span></label>
                <ImageUploader value={form.image} onChange={v => setForm(f => ({ ...f, image: v }))} exactWidth={slot?.w} exactHeight={slot?.h} />
              </div>
            );
          })()}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              <span className="form-label" style={{ margin: 0 }}>Active</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
