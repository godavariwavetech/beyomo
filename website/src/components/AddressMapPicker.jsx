import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineKm } from '../utils/geo';

function MapEvents({ onMoveEnd }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onMoveEnd({ lat: c.lat, lng: c.lng });
    },
  });
  return null;
}

function RecenterOnCity({ city }) {
  const map = useMap();
  useEffect(() => {
    if (city?.lat != null && city?.lng != null) {
      map.setView([city.lat, city.lng], 14);
    }
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function AddressMapPicker({ city, onConfirm }) {
  const [pin, setPin] = useState({ lat: city?.lat, lng: city?.lng });
  const [fields, setFields] = useState({ label: 'Home', line1: '', line2: '', city: city?.name || '', state: city?.state || '', pincode: '' });
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef(null);

  const distanceKm = city?.lat != null && pin.lat != null ? haversineKm(pin.lat, pin.lng, city.lat, city.lng) : 0;
  const radius = city?.radius ?? 30;
  const outOfRange = distanceKm > radius;

  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const addr = data.address || {};
      setFields((f) => ({
        ...f,
        line1: f.line1 || [addr.house_number, addr.road].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || f.line1,
        city: addr.city || addr.town || addr.village || f.city,
        state: addr.state || f.state,
        pincode: addr.postcode || f.pincode,
      }));
    } catch {
      // reverse geocoding failed — fields stay editable as fallback
    } finally {
      setGeocoding(false);
    }
  };

  const handleMoveEnd = (next) => {
    setPin(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => reverseGeocode(next.lat, next.lng), 500);
  };

  if (!city?.lat || !city?.lng) {
    return <p style={{ color: 'var(--muted)', fontSize: 14 }}>Select a city to pick your address on the map.</p>;
  }

  return (
    <div>
      <div style={{ position: 'relative', height: 320, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1.5px solid var(--border)' }}>
        <MapContainer center={[city.lat, city.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Circle center={[city.lat, city.lng]} radius={radius * 1000} pathOptions={{ color: '#105641', fillOpacity: 0.05 }} />
          <MapEvents onMoveEnd={handleMoveEnd} />
          <RecenterOnCity city={city} />
        </MapContainer>
        {/* Fixed center pin overlay — map pans underneath it */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', fontSize: 34, pointerEvents: 'none', zIndex: 500 }}>
          📍
        </div>
        {geocoding && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'white', borderRadius: 'var(--r-full)', padding: '4px 12px', fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-sm)', zIndex: 500 }}>
            Locating…
          </div>
        )}
      </div>

      {outOfRange && (
        <p style={{ color: '#EF4444', fontSize: 13, marginTop: 10 }}>
          This location is outside our service area for {city.name}. Please move the pin closer to {city.name}.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Address Label</label>
          <input className="form-input" value={fields.label} onChange={(e) => setFields((f) => ({ ...f, label: e.target.value }))} placeholder="Home, Office, etc." />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Flat / House No., Street</label>
          <input className="form-input" value={fields.line1} onChange={(e) => setFields((f) => ({ ...f, line1: e.target.value }))} placeholder="House no., street, area" />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Landmark (optional)</label>
          <input className="form-input" value={fields.line2} onChange={(e) => setFields((f) => ({ ...f, line2: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">City</label>
          <input className="form-input" value={fields.city} onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">State</label>
          <input className="form-input" value={fields.state} onChange={(e) => setFields((f) => ({ ...f, state: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Pincode</label>
          <input className="form-input" value={fields.pincode} onChange={(e) => setFields((f) => ({ ...f, pincode: e.target.value }))} />
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', opacity: outOfRange || !fields.line1 ? 0.5 : 1 }}
        disabled={outOfRange || !fields.line1}
        onClick={() => onConfirm({ ...fields, lat: pin.lat, lng: pin.lng })}
      >
        Use This Address
      </button>
    </div>
  );
}
