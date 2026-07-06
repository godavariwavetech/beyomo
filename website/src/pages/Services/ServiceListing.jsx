import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { useCity } from '../../context/CityContext';
import { useCart } from '../../context/CartContext';
import { getServices, getCategories } from '../../api/services';
import ServiceCard from '../../components/ServiceCard';
import CartBar from '../../components/CartBar';
import CitySelectorModal from '../../components/CitySelectorModal';

export default function ServiceListing() {
  const { categoryId } = useParams();
  const { state, search: locationSearch } = useLocation();
  const { city } = useCity();
  const { items, addItem, incrementItem, decrementItem } = useCart();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(() => new URLSearchParams(locationSearch).get('q') || '');
  const [cityModalOpen, setCityModalOpen] = useState(!city);
  const [categoryName, setCategoryName] = useState(state?.categoryName || null);

  useEffect(() => {
    if (!city) {
      setCityModalOpen(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    getServices({ categoryId, cityId: city.id, search: search || undefined })
      .then((res) => setServices(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [categoryId, city, search]);

  // Resolve the category name from the API whenever we land here without router state
  // (direct URL visit, refresh, or any entry point other than the homepage tiles).
  useEffect(() => {
    if (state?.categoryName || !categoryId) return;
    getCategories(city?.id).then((res) => {
      const match = (res.data || []).find((c) => String(c.id) === String(categoryId));
      if (match) setCategoryName(match.name);
    }).catch(() => {});
  }, [categoryId, city?.id, state?.categoryName]);

  const qtyFor = (id) => items.find((i) => i.id === id)?.qty || 0;
  const heading = categoryName || (search ? `Results for "${search}"` : 'All Services');

  return (
    <div style={{ paddingBottom: items.length > 0 ? 90 : 0 }}>
      <CitySelectorModal open={cityModalOpen} onClose={() => setCityModalOpen(false)} />

      <div className="page-hero page-hero-compact">
        <div className="container page-hero-inner">
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} /> {city?.name || 'Select your city'}
          </span>
          <h1>{heading}</h1>
          <p>
            {city && !loading
              ? `${services.length} verified professional${services.length === 1 ? '' : 's'} ready to book in ${city.name}`
              : 'Trusted, verified professionals — booked in minutes.'}
          </p>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="form-group" style={{ maxWidth: 380, marginBottom: 36, position: 'relative' }}>
            <Search size={16} color="var(--muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 42 }}
            />
          </div>

          {!city && !cityModalOpen && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Select your city to see available services.</p>
              <button className="btn btn-primary" onClick={() => setCityModalOpen(true)}><MapPin size={16} /> Select City</button>
            </div>
          )}

          {city && loading && <p style={{ color: 'var(--muted)' }}>Loading services…</p>}
          {city && error && <p style={{ color: '#EF4444' }}>{error}</p>}
          {city && !loading && !error && services.length === 0 && (
            <p style={{ color: 'var(--muted)' }}>No services found{search ? ` for "${search}"` : ''}.</p>
          )}

          {city && !loading && services.length > 0 && (
            <div className="services-grid">
              {services.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  qty={qtyFor(s.id)}
                  onIncrement={() => (qtyFor(s.id) ? incrementItem(s.id) : addItem(s))}
                  onDecrement={() => decrementItem(s.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CartBar />
    </div>
  );
}
