import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function FlyTo({ lat, lng }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (lat && lng) {
      const key = `${lat},${lng}`;
      if (prevRef.current !== key) {
        prevRef.current = key;
        map.flyTo([lat, lng], map.getZoom() < 10 ? 13 : map.getZoom(), { duration: 0.8 });
      }
    }
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(parseFloat(e.latlng.lat.toFixed(6)), parseFloat(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange, radius, height = 320 }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  const hasPin = lat !== '' && lng !== '' && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));
  const pinLat = hasPin ? parseFloat(lat) : null;
  const pinLng = hasPin ? parseFloat(lng) : null;
  const defaultCenter = hasPin ? [pinLat, pinLng] : [20.5937, 78.9629];
  const defaultZoom = hasPin ? 13 : 5;

  // Keep coordinate inputs in sync when marker is placed via map click / drag / search
  useEffect(() => { setLatInput(lat === '' ? '' : String(lat)); }, [lat]);
  useEffect(() => { setLngInput(lng === '' ? '' : String(lng)); }, [lng]);

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      setResults(await res.json());
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const pickResult = (r) => {
    onChange(parseFloat(parseFloat(r.lat).toFixed(6)), parseFloat(parseFloat(r.lon).toFixed(6)));
    setSearch('');
    setResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const h = (e) => { if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setResults([]); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const commitLat = () => {
    const n = parseFloat(latInput);
    if (!isNaN(n)) onChange(parseFloat(n.toFixed(6)), lng === '' ? 0 : parseFloat(lng));
    else if (latInput === '') onChange('', lng);
  };

  const commitLng = () => {
    const n = parseFloat(lngInput);
    if (!isNaN(n)) onChange(lat === '' ? 0 : parseFloat(lat), parseFloat(n.toFixed(6)));
    else if (lngInput === '') onChange(lat, '');
  };

  return (
    <div>
      {/* Search bar */}
      <div ref={searchBoxRef} style={{ position: 'relative', zIndex: 2000, marginBottom: 8 }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, pointerEvents: 'none', color: 'var(--c-text-muted)',
          }}>🔍</span>
          <input
            className="form-input"
            style={{ paddingLeft: 32 }}
            placeholder="Search city or area (e.g. Hyderabad, Telangana)"
            value={search}
            onChange={handleSearchChange}
          />
          {searching && (
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 11, color: 'var(--c-text-muted)',
            }}>searching…</span>
          )}
        </div>

        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 2001,
            backgroundColor: '#ffffff',
            border: '1px solid var(--c-border)',
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            marginTop: 2, maxHeight: 240, overflowY: 'auto',
          }}>
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={() => pickResult(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '9px 12px', backgroundColor: 'transparent', border: 'none',
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid #f0f0f0' : 'none',
                  color: 'var(--c-text-primary)',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f7fa'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 500, fontSize: 13 }}>
                  {r.display_name.split(',').slice(0, 2).join(',')}
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--c-border)', cursor: 'crosshair', height }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={onChange} />
          {hasPin && (
            <>
              <Marker
                position={[pinLat, pinLng]}
                draggable
                eventHandlers={{
                  dragend(e) {
                    const { lat: la, lng: lo } = e.target.getLatLng();
                    onChange(parseFloat(la.toFixed(6)), parseFloat(lo.toFixed(6)));
                  },
                }}
              />
              {radius > 0 && (
                <Circle
                  center={[pinLat, pinLng]}
                  radius={radius * 1000}
                  pathOptions={{ color: '#064081', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
                />
              )}
              <FlyTo lat={pinLat} lng={pinLng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Coordinate inputs */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="form-input"
            style={{ fontSize: 12, paddingLeft: 28 }}
            placeholder="Latitude"
            type="number"
            step="any"
            value={latInput}
            onChange={e => setLatInput(e.target.value)}
            onBlur={commitLat}
            onKeyDown={e => e.key === 'Enter' && commitLat()}
          />
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--c-text-muted)', fontWeight: 600, pointerEvents: 'none' }}>LAT</span>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="form-input"
            style={{ fontSize: 12, paddingLeft: 28 }}
            placeholder="Longitude"
            type="number"
            step="any"
            value={lngInput}
            onChange={e => setLngInput(e.target.value)}
            onBlur={commitLng}
            onKeyDown={e => e.key === 'Enter' && commitLng()}
          />
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--c-text-muted)', fontWeight: 600, pointerEvents: 'none' }}>LNG</span>
        </div>
        {hasPin && (
          <button
            type="button"
            onClick={() => onChange('', '')}
            style={{ fontSize: 12, color: 'var(--c-danger)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: '0 4px', textDecoration: 'underline' }}
          >
            Clear
          </button>
        )}
      </div>

      {!hasPin && (
        <p style={{ fontSize: 11, color: 'var(--c-text-muted)', fontStyle: 'italic', marginTop: 4 }}>
          Search above, click the map, or type coordinates directly — then drag the pin to fine-tune.
        </p>
      )}
    </div>
  );
}
