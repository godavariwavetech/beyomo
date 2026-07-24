import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, ToggleLeft, ToggleRight, Globe, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { useZones } from '../hooks/useZones';
import api from '../services/api';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const parseArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
};

const EMPTY_FORM = { name: '', description: '', cityIds: [], isActive: true };

function ZoneForm({ form, f, toggleCity, cities }) {
  return (
    <div className="form-grid">
      <div className="form-grid form-grid-2">
        <div className="form-group">
          <label className="form-label">Zone Name *</label>
          <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Hyderabad Zone" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" value={form.description} onChange={e => f('description', e.target.value)} placeholder="Optional description" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Cities in this Zone *
          <span style={{ fontWeight: 400, color: 'var(--c-text-muted)', marginLeft: 6 }}>
            ({form.cityIds.length} selected)
          </span>
        </label>
        {cities.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 13, background: 'var(--c-border-light)', borderRadius: 'var(--r-md)' }}>
            No cities found. Add cities first from the Cities page.
          </div>
        ) : (
          <div className="form-grid form-grid-3" style={{ gap: 8 }}>
            {cities.map(city => {
              const checked = form.cityIds.includes(city.id);
              return (
                <div
                  key={city.id}
                  onClick={() => toggleCity(city.id)}
                  style={{
                    border: `1.5px solid ${checked ? 'var(--c-success)' : 'var(--c-border)'}`,
                    borderRadius: 'var(--r-md)', padding: '10px 12px',
                    background: checked ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                    cursor: 'pointer', transition: 'var(--t-fast)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <MapPin size={14} style={{ color: checked ? 'var(--c-success)' : 'var(--c-text-muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: checked ? 'var(--c-success-text)' : 'var(--c-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {city.name}
                    </div>
                    {city.state && <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{city.state}</div>}
                  </div>
                  {checked
                    ? <CheckCircle size={14} style={{ color: 'var(--c-success)', flexShrink: 0 }} />
                    : <XCircle size={14} style={{ color: 'var(--c-border)', flexShrink: 0 }} />
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} />
          <span className="form-label" style={{ margin: 0 }}>Active (zone is available for permission assignment)</span>
        </label>
      </div>
    </div>
  );
}

export default function Zones() {
  const { showToast } = useAuth();
  const { fetchList, create, update, remove } = useZones();
  const [zones, setZones]     = useState([]);
  const [cities, setCities]   = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState(EMPTY_FORM);

  const loadZones = () => {
    fetchList().then(res => { if (res.ok) setZones(res.data?.data ?? []); });
    api.get('/api/v1/admin/cities').then(r => setCities(r.data?.data ?? [])).catch(() => {});
  };

  useEffect(() => { loadZones(); }, []);
  useAutoRefresh(loadZones);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleCity = (cityId) =>
    setForm(p => ({
      ...p,
      cityIds: p.cityIds.includes(cityId)
        ? p.cityIds.filter(id => id !== cityId)
        : [...p.cityIds, cityId],
    }));

  const toPayload = () => ({
    name: form.name,
    description: form.description,
    cityIds: form.cityIds,
    isActive: form.isActive,
  });

  const saveNew = async () => {
    if (!form.name) { showToast('Zone name is required.', 'danger'); return; }
    if (!form.cityIds.length) { showToast('Select at least one city.', 'danger'); return; }
    const res = await create(toPayload());
    if (res.ok) {
      setZones(p => [...p, res.data?.data ?? toPayload()]);
      showToast('Zone created!', 'success');
      setAdding(false);
    } else showToast(res.error ?? 'Failed to create zone.', 'danger');
  };

  const saveEdit = async () => {
    if (!form.name) { showToast('Zone name is required.', 'danger'); return; }
    if (!form.cityIds.length) { showToast('Select at least one city.', 'danger'); return; }
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
    setForm({ name: z.name || '', description: z.description || '', cityIds: parseArr(z.cityIds), isActive: z.isActive ?? true });
  };

  const openAdd = () => { setAdding(true); setForm(EMPTY_FORM); };

  const getCityName = (id) => cities.find(c => c.id === id)?.name ?? `City #${id}`;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} /> Admin Zones
            </div>
            <div className="card-subtitle">Group cities into zones and assign them to admin users for data access control</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Zone
          </button>
        </div>

        {zones.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 14 }}>
            <Globe size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            No zones defined yet. Click Add Zone to create one.
          </div>
        ) : (
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {zones.map(zone => {
              const zoneCities = parseArr(zone.cityIds).map(id => getCityName(id));
              return (
                <div
                  key={zone.id}
                  style={{
                    border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)',
                    padding: '14px 16px', opacity: zone.isActive ? 1 : 0.6,
                    borderLeft: `4px solid ${zone.isActive ? 'var(--c-success)' : 'var(--c-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Globe size={14} style={{ color: 'var(--c-primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{zone.name}</span>
                        <span style={{
                          background: zone.isActive ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                          color: zone.isActive ? 'var(--c-success)' : 'var(--c-text-muted)',
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)',
                        }}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {zone.description && (
                        <div style={{ fontSize: 12, color: 'var(--c-text-secondary)', marginBottom: 8 }}>{zone.description}</div>
                      )}
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--c-text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Cities ({zoneCities.length})
                        </div>
                        {zoneCities.length === 0 ? (
                          <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>No cities assigned</span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {zoneCities.map(name => (
                              <span key={name} style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                borderRadius: 'var(--r-full)',
                                background: 'var(--c-brand-teal-bg,#e0f7f4)', color: 'var(--c-primary)',
                              }}>
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => toggleActive(zone)} title={zone.isActive ? 'Deactivate' : 'Activate'}>
                        {zone.isActive ? <ToggleRight size={16} style={{ color: 'var(--c-success)' }} /> : <ToggleLeft size={16} />}
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(zone)}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--c-danger)' }} onClick={() => deleteZone(zone.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add Zone" size="lg"
        footer={<><button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button><button className="btn btn-primary" onClick={saveNew}>Create Zone</button></>}>
        <ZoneForm form={form} f={f} toggleCity={toggleCity} cities={cities} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit Zone — ${editing?.name}`} size="lg"
        footer={<><button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save Changes</button></>}>
        {editing && <ZoneForm form={form} f={f} toggleCity={toggleCity} cities={cities} />}
      </Modal>
    </div>
  );
}
