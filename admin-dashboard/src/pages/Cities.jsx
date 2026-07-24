import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import MapPicker from '../components/common/MapPicker';
import { useAuth } from '../context/AuthContext';
import { useCities } from '../hooks/useCities';
import { useCityFilter } from '../context/CityContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const EMPTY_FORM = { name: '', state: '', lat: '', lng: '', radius: 30, isActive: true };

const CityForm = ({ form, f }) => (
  <div className="form-grid">
    <div className="form-group">
      <label className="form-label">City Name *</label>
      <input className="form-input" value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Hyderabad" />
    </div>
    <div className="form-group">
      <label className="form-label">State</label>
      <input className="form-input" value={form.state} onChange={e => f('state', e.target.value)} placeholder="e.g. Telangana" />
    </div>
    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
      <label className="form-label">City Center Location</label>
      <MapPicker
        lat={form.lat}
        lng={form.lng}
        onChange={(lat, lng) => { f('lat', lat); f('lng', lng); }}
        radius={parseFloat(form.radius) || 0}
        height={320}
      />
    </div>
    <div className="form-group">
      <label className="form-label">Service Radius (km)</label>
      <input className="form-input" type="number" min="1" value={form.radius} onChange={e => f('radius', e.target.value)} placeholder="e.g. 30" />
      <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 4 }}>Bookings and location pins must fall within this radius from the center.</p>
    </div>
    <div className="form-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => f('isActive', e.target.checked)} />
        <span className="form-label" style={{ margin: 0 }}>Active (city is live and accepting bookings)</span>
      </label>
    </div>
  </div>
);

export default function Cities() {
  const { showToast } = useAuth();
  const { fetchList, create, update, remove } = useCities();
  const { reloadCities } = useCityFilter();
  const [cities, setCities] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadCities = () => {
    fetchList().then(res => { if (res.ok) setCities(res.data?.data ?? []); });
  };

  useEffect(() => { loadCities(); }, []);
  useAutoRefresh(loadCities);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toGeoPayload = (f) => ({
    name: f.name.trim(),
    state: f.state.trim() || null,
    lat: f.lat !== '' ? parseFloat(f.lat) : null,
    lng: f.lng !== '' ? parseFloat(f.lng) : null,
    radius: f.radius ? parseFloat(f.radius) : 30,
    isActive: f.isActive,
  });

  const saveNew = async () => {
    if (!form.name.trim()) { showToast('City name is required.', 'danger'); return; }
    const res = await create(toGeoPayload(form));
    if (res.ok) {
      setCities(p => [...p, res.data?.data ?? form]);
      showToast('City added!', 'success');
      setAdding(false);
      reloadCities();
    } else {
      showToast(res.error ?? 'Failed to create city.', 'danger');
    }
  };

  const saveEdit = async () => {
    if (!form.name.trim()) { showToast('City name is required.', 'danger'); return; }
    const res = await update(editing.id, toGeoPayload(form));
    if (res.ok) {
      setCities(p => p.map(c => c.id === editing.id ? { ...c, ...form } : c));
      showToast('City updated!', 'success');
      setEditing(null);
      reloadCities();
    } else {
      showToast(res.error ?? 'Failed to update city.', 'danger');
    }
  };

  const toggleActive = async (city) => {
    const res = await update(city.id, { isActive: !city.isActive });
    if (res.ok) {
      setCities(p => p.map(c => c.id === city.id ? { ...c, isActive: !c.isActive } : c));
      showToast(`City ${!city.isActive ? 'activated' : 'deactivated'}.`, 'success');
      reloadCities();
    } else {
      showToast(res.error ?? 'Failed.', 'danger');
    }
  };

  const deleteCity = async (id) => {
    const res = await remove(id);
    if (res.ok) {
      setCities(p => p.filter(c => c.id !== id));
      showToast('City deleted.', 'danger');
      reloadCities();
    } else {
      showToast(res.error ?? 'Failed to delete.', 'danger');
    }
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name || '', state: c.state || '', lat: c.lat ?? '', lng: c.lng ?? '', radius: c.radius ?? 30, isActive: c.isActive ?? true });
  };

  const active = cities.filter(c => c.isActive).length;

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid stats-grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Cities',  value: cities.length, color: '#064081' },
          { label: 'Active Cities', value: active,        color: '#22C55E' },
          { label: 'Inactive',      value: cities.length - active, color: '#FF9500' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={16} /> Cities
            </div>
            <div className="card-subtitle">Add cities where your service is available. Dashboard data filters by city.</div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setAdding(true); setForm(EMPTY_FORM); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={14} /> Add City
          </button>
        </div>

        {cities.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--c-text-secondary)', fontSize: 14 }}>
            No cities added yet. Click <strong>Add City</strong> to get started.
          </div>
        ) : (
          <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {cities.map(city => (
              <div
                key={city.id}
                style={{
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '14px 16px',
                  opacity: city.isActive ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-full)',
                    background: city.isActive ? 'var(--c-brand-teal-bg, #e0f7f4)' : 'var(--c-border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MapPin size={16} style={{ color: city.isActive ? 'var(--c-primary)' : 'var(--c-text-muted)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {city.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
                      {city.state || '—'} &nbsp;
                      <span style={{
                        background: city.isActive ? 'var(--c-success-bg)' : 'var(--c-border-light)',
                        color: city.isActive ? 'var(--c-success)' : 'var(--c-text-muted)',
                        fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--r-full)',
                      }}>
                        {city.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {city.lat && city.lng ? (
                      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>
                        {city.lat.toFixed(4)}, {city.lng.toFixed(4)} &bull; r={city.radius ?? 30}km
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#FF9500', marginTop: 2 }}>No coordinates set</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => toggleActive(city)} title={city.isActive ? 'Deactivate' : 'Activate'}>
                    {city.isActive
                      ? <ToggleRight size={16} style={{ color: 'var(--c-success)' }} />
                      : <ToggleLeft size={16} />}
                  </button>
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(city)}><Edit2 size={14} /></button>
                  <button className="btn btn-ghost btn-icon" style={{ color: 'var(--c-danger)' }} onClick={() => deleteCity(city.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={adding}
        onClose={() => setAdding(false)}
        title="Add City"
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveNew}>Add City</button>
          </>
        }
      >
        <CityForm form={form} f={f} />
      </Modal>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit City — ${editing?.name}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
          </>
        }
      >
        {editing && <CityForm form={form} f={f} />}
      </Modal>
    </div>
  );
}
