import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, ToggleLeft, ToggleRight, Globe } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useZones } from '../hooks/useZones';

const EMPTY_FORM = { name: '', description: '', cities: '', pincodes: '', isActive: true };

const parseList = (str) => str.split(',').map(s => s.trim()).filter(Boolean);
const joinList = (arr) => (arr || []).join(', ');

const ZoneForm = ({ form, f }) => (
  <div className="form-grid">
    <div className="form-group">
      <label className="form-label">Zone Name *</label>
      <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Hyderabad Zone" />
    </div>
    <div className="form-group">
      <label className="form-label">Description</label>
      <input className="form-input" value={form.description} onChange={e => f('description', e.target.value)} placeholder="Optional description" />
    </div>
    <div className="form-group">
      <label className="form-label">Cities</label>
      <textarea className="form-input" rows={3} value={form.cities} onChange={e => f('cities', e.target.value)} placeholder="Hyderabad, Secunderabad, Cyberabad" style={{ resize: 'vertical' }} />
      <span className="form-hint">Comma-separated city names (case-insensitive match)</span>
    </div>
    <div className="form-group">
      <label className="form-label">Pincodes</label>
      <textarea className="form-input" rows={3} value={form.pincodes} onChange={e => f('pincodes', e.target.value)} placeholder="500081, 500072, 500034" style={{ resize: 'vertical' }} />
      <span className="form-hint">Comma-separated pincodes</span>
    </div>
    <div className="form-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} />
        <span className="form-label" style={{ margin: 0 }}>Active (used for serviceability checks)</span>
      </label>
    </div>
  </div>
);

export default function Zones() {
  const { showToast } = useAuth();
  const { fetchList, create, update, remove } = useZones();
  const [zones, setZones] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchList().then(res => { if (res.ok) setZones(res.data?.data ?? []); });
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toPayload = () => ({
    ...form,
    cities: parseList(form.cities),
    pincodes: parseList(form.pincodes),
  });

  const saveNew = async () => {
    if (!form.name) { showToast('Zone name is required.', 'danger'); return; }
    const res = await create(toPayload());
    if (res.ok) {
      setZones(p => [...p, res.data?.data ?? toPayload()]);
      showToast('Zone created!', 'success');
      setAdding(false);
    } else showToast(res.error ?? 'Failed to create zone.', 'danger');
  };

  const saveEdit = async () => {
    if (!form.name) { showToast('Zone name is required.', 'danger'); return; }
    const res = await update(editing.id, toPayload());
    if (res.ok) {
      setZones(p => p.map(z => z.id === editing.id ? { ...z, ...toPayload() } : z));
      showToast('Zone updated!', 'success');
      setEditing(null);
    } else showToast(res.error ?? 'Failed to update zone.', 'danger');
  };

  const toggleActive = async (zone) => {
    const res = await update(zone.id, { isActive: !zone.isActive });
    if (res.ok) {
      setZones(p => p.map(z => z.id === zone.id ? { ...z, isActive: !z.isActive } : z));
      showToast(`Zone ${!zone.isActive ? 'activated' : 'deactivated'}.`, 'success');
    } else showToast(res.error ?? 'Failed.', 'danger');
  };

  const deleteZone = async (id) => {
    const res = await remove(id);
    if (res.ok) {
      setZones(p => p.filter(z => z.id !== id));
      showToast('Zone deleted.', 'danger');
    } else showToast(res.error ?? 'Failed to delete.', 'danger');
  };

  const openEdit = (z) => {
    setEditing(z);
    setForm({
      name: z.name || '',
      description: z.description || '',
      cities: joinList(z.cities),
      pincodes: joinList(z.pincodes),
      isActive: z.isActive ?? true,
    });
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Globe size={16}/> Service Zones</div>
            <div className="card-subtitle">Define cities and pincodes where service is available</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setForm(EMPTY_FORM); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14}/> Add Zone
          </button>
        </div>

        {zones.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 14 }}>
            No service zones defined yet. Click Add Zone to get started.
          </div>
        ) : (
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {zones.map(zone => (
              <div key={zone.id} style={{ border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '14px 16px', opacity: zone.isActive ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <MapPin size={14} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{zone.name}</span>
                      <span style={{ background: zone.isActive ? 'var(--c-success-bg)' : 'var(--c-border-light)', color: zone.isActive ? 'var(--c-success)' : 'var(--c-text-muted)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {zone.description && <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', marginBottom: 8 }}>{zone.description}</div>}
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--c-text-muted)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cities ({(zone.cities || []).length})</div>
                        <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>{(zone.cities || []).join(', ') || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--c-text-muted)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pincodes ({(zone.pincodes || []).length})</div>
                        <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', maxWidth: 400 }}>{(zone.pincodes || []).join(', ') || '—'}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => toggleActive(zone)} title={zone.isActive ? 'Deactivate' : 'Activate'}>
                      {zone.isActive ? <ToggleRight size={16} style={{ color: 'var(--c-success)' }}/> : <ToggleLeft size={16}/>}
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(zone)}><Edit2 size={14}/></button>
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--c-danger)' }} onClick={() => deleteZone(zone.id)}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add Service Zone"
        footer={<><button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={saveNew}>Create Zone</button></>}>
        <ZoneForm form={form} f={f} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit Zone — ${editing?.name}`}
        footer={<><button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save Changes</button></>}>
        {editing && <ZoneForm form={form} f={f} />}
      </Modal>
    </div>
  );
}
