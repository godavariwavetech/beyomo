import { useState, useRef, useEffect } from 'react';
import { MapPin, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './AddressMapPicker.css';
import { cityKey, searchLocations } from '../../utils/locationSearch';
import { addressFields as photonToFields, lookupAddress } from '../../utils/addressLookup';

const DEFAULT_CENTER = [14.4426, 79.9865]; // Nellore, Andhra Pradesh
const DEFAULT_ZOOM = 14;

function photonLabel(props = {}) {
  return [props.name, props.street, props.city || props.town || props.village, props.state]
    .filter((v, i, arr) => v && arr.indexOf(v) === i)
    .join(', ');
}

async function reverseGeocode(lat, lng, signal) {
  const features = await lookupAddress('reverse', new URLSearchParams({lat, lon: lng, lang: 'en'}), signal);
  if (!features.length) throw new Error('No address found');
  return features[0].properties || {};
}

function MapEvents({ onMoveEnd }) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });
  return null;
}

const AddressMapPicker = ({ initialAddress, cities = [], onConfirm, onClose }) => {
  const initialCity = cities.find(c => c.name === initialAddress?.city) ?? cities[0];
  const defaultCenter = initialCity?.lat != null && initialCity?.lng != null
    ? [Number(initialCity.lat), Number(initialCity.lng)] : DEFAULT_CENTER;
  const mapRef = useRef(null);
  const selectedLocationRef = useRef(null);
  const debounceRef = useRef(null);
  const [center, setCenter] = useState(
    initialAddress?.lat != null && initialAddress?.lng != null
      ? [initialAddress.lat, initialAddress.lng]
      : defaultCenter
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [locating, setLocating] = useState(false);
  const [fields, setFields] = useState({
    line1: initialAddress?.line1 || '',
    line2: initialAddress?.line2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    pincode: initialAddress?.pincode || '',
  });
  const [label, setLabel] = useState(initialAddress?.label || 'Home');
  const [lat, setLat] = useState(initialAddress?.lat ?? defaultCenter[0]);
  const [lng, setLng] = useState(initialAddress?.lng ?? defaultCenter[1]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDebounceRef = useRef(null);
  const geocodeAbortRef = useRef(null);
  const searchAbortRef = useRef(null);

  const runReverseGeocode = async (newLat, newLng) => {
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    const controller = new AbortController();
    geocodeAbortRef.current = controller;

    setGeocoding(true);
    setGeoError('');
    try {
      const props = await reverseGeocode(newLat, newLng, controller.signal);
      const detected = photonToFields(props);
      const city = cities.find(c => cityKey(c.name) === cityKey(detected.city));
      if (!controller.signal.aborted) setFields({ ...detected, city: city?.name ?? detected.city });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setGeoError('Could not detect address for this location. Please fill it in manually.');
      }
    }
    if (!controller.signal.aborted) setGeocoding(false);
  };

  const handleMoveEnd = (newLat, newLng) => {
    const selected = selectedLocationRef.current;
    selectedLocationRef.current = null;
    if (selected && Math.abs(selected[0] - newLat) < 0.000001 && Math.abs(selected[1] - newLng) < 0.000001) return;
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    setGeocoding(true);
    setLat(newLat);
    setLng(newLng);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runReverseGeocode(newLat, newLng), 500);
  };

  useEffect(() => {
    if (!initialAddress?.line1 && (initialAddress?.lat == null || initialAddress?.lng == null)) {
      runReverseGeocode(center[0], center[1]);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], DEFAULT_ZOOM);
        }
        setLat(latitude);
        setLng(longitude);
        runReverseGeocode(latitude, longitude);
        setLocating(false);
      },
      () => {
        setGeoError('Could not access your location. Please allow location permission or move the map manually.');
        setLocating(false);
      }
    );
  };

  const handleFieldChange = (key, value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    setGeocoding(false);
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSearchError('');
    setShowSearchResults(false);
    setSearching(value.trim().length >= 2);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    setSearchResults([]);
    if (!value || value.trim().length < 2) {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      setSearchResults([]);
      setShowSearchResults(false);
      setSearching(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSearching(true);
      try {
        const results = await searchLocations(value, lat, lng, cities, controller.signal);
        if (!controller.signal.aborted) {
          setSearchResults(results);
          setShowSearchResults(true);
        }
      } catch (err) {
        if (err.name !== 'AbortError') { setSearchResults([]); setSearchError('Location search is unavailable. Please try again or select the location on the map.'); }
      }
      if (!controller.signal.aborted) setSearching(false);
    }, 250);
  };

  const handleSelectSearchResult = (result) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (geocodeAbortRef.current) geocodeAbortRef.current.abort();
    setGeocoding(false);
    setGeoError('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchAbortRef.current) searchAbortRef.current.abort();
    setSearching(false);
    const [newLng, newLat] = result.geometry.coordinates;
    selectedLocationRef.current = [newLat, newLng];
    setCenter([newLat, newLng]);
    if (mapRef.current) {
      mapRef.current.setView([newLat, newLng], DEFAULT_ZOOM);
    }
    setLat(newLat);
    setLng(newLng);
    setShowSearchResults(false);
    setSearchQuery(photonLabel(result.properties));
    const detected = photonToFields(result.properties);
    const city = cities.find(c => cityKey(c.name) === cityKey(detected.city));
    setFields({ ...detected, city: city?.name ?? detected.city });
  };

  const addressError = !fields.line1.trim() ? 'Select a location with an address or enter the house / street.'
    : !cities.some(c => c.name === fields.city) ? 'Choose an active service city.'
    : !fields.state.trim() ? 'Enter the state if the map could not detect it.'
    : fields.pincode.trim() && !/^\d{6}$/.test(fields.pincode.trim()) ? 'Pincode must be six digits, or leave it empty.'
    : '';

  const handleConfirm = () => {
    if (geocoding || addressError) return;
    onConfirm({ ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.trim()])), label, lat, lng });
  };

  return (
    <div className="admin-address-picker">
      <div className="address-map-modal">
        <div className="address-map-header">
          <h3>Select Customer Service Address</h3>
          <button className="address-map-close" onClick={onClose} type="button">Cancel</button>
        </div>

        <div className="address-map-search">
          <input
            type="text"
            placeholder="Search for a location…"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
          />
          {searching && <span className="address-map-search-spinner">Searching…</span>}
          {searchError && <p className="address-map-search-feedback" role="alert">{searchError}</p>}
          {showSearchResults && !searching && searchResults.length === 0 && <p className="address-map-search-feedback" role="status">No matching location found. Try the city name with a landmark, or select the location on the map.</p>}
          {showSearchResults && searchResults.length > 0 && (
            <div className="address-map-search-results">
              {searchResults.map((result, idx) => (
                <button
                  type="button"
                  key={`${result.properties.osm_type}-${result.properties.osm_id}-${idx}`}
                  className="address-map-search-item"
                  onClick={() => handleSelectSearchResult(result)}
                >
                  {photonLabel(result.properties)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="address-map-container">
          <MapContainer
            center={center}
            zoom={DEFAULT_ZOOM}
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Address search: Photon / Nominatim'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMoveEnd={handleMoveEnd} />
            <ZoomControl position="bottomright" />
          </MapContainer>
          <div className="map-center-pin">
            <MapPin size={32} fill="currentColor" stroke="white" />
          </div>
          <button className="locate-me-btn" type="button" onClick={handleLocateMe} disabled={locating}>
            <Crosshair size={16} />
            {locating ? 'Locating…' : 'Use This Device Location'}
          </button>
          {geocoding && <div className="map-status-banner">Detecting address…</div>}
        </div>

        {geoError && <p className="address-map-error">{geoError}</p>}

        <div className="address-map-fields">
          <p style={{ margin: 0, fontSize: 12 }}>Search for the customer location or move the map pin. Review the address below. You can also enter the address manually if lookup is unavailable.</p>
          <div className="address-map-tag-selector">
            {['Home', 'Work', 'Other'].map((t) => (
              <button
                key={t}
                type="button"
                className={`address-map-tag-option ${label === t ? 'active' : ''}`}
                onClick={() => setLabel(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="House / Flat / Street"
            value={fields.line1}
            onChange={(e) => handleFieldChange('line1', e.target.value)}
          />
          <input
            type="text"
            placeholder="Landmark / Area"
            value={fields.line2}
            onChange={(e) => handleFieldChange('line2', e.target.value)}
          />
          <div className="address-map-fields-row">
            <select aria-label="Service city" value={fields.city} onChange={e => handleFieldChange('city', e.target.value)}>
              <option value="">Select service city</option>
              {fields.city && !cities.some(c => c.name === fields.city) && <option value={fields.city}>{fields.city} (not a service city)</option>}
              {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="State"
              value={fields.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
            />
            <input
              type="text"
              placeholder="Pincode (optional)"
              aria-label="Pincode (optional)"
              inputMode="numeric"
              maxLength={6}
              value={fields.pincode}
              onChange={(e) => handleFieldChange('pincode', e.target.value)}
            />
          </div>
        </div>

        {!geocoding && addressError && <p className="address-map-error" role="status" style={{marginBottom:12}}>{addressError}</p>}
        <button
          className="address-map-confirm"
          type="button"
          onClick={handleConfirm}
          disabled={geocoding || !!addressError}
        >
          Confirm Address
        </button>
      </div>
    </div>
  );
};

export default AddressMapPicker;
