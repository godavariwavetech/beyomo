import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCity } from '../../context/CityContext';
import { getCategories } from '../../api/services';
import CitySelectorModal from '../../components/CitySelectorModal';

export default function CategoryListing() {
  const { city } = useCity();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cityModalOpen, setCityModalOpen] = useState(!city);

  useEffect(() => {
    if (!city) {
      setCityModalOpen(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    getCategories(city.id)
      .then((res) => setCategories(res.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [city]);

  return (
    <div>
      <CitySelectorModal open={cityModalOpen} onClose={() => setCityModalOpen(false)} />

      <div className="page-hero page-hero-compact">
        <div className="container page-hero-inner">
          <span className="badge">Browse Services</span>
          <h1>What are you looking for{city ? ` in ${city.name}` : ''}?</h1>
        </div>
      </div>

      <div className="section">
        <div className="container">
          {!city && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Select your city to see available services.</p>
              <button className="btn btn-primary" onClick={() => setCityModalOpen(true)}>📍 Select City</button>
            </div>
          )}

          {city && loading && <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading categories…</p>}
          {city && error && <p style={{ textAlign: 'center', color: '#EF4444' }}>{error}</p>}
          {city && !loading && !error && categories.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No categories available in {city.name} yet.</p>
          )}

          {city && !loading && categories.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/services/${cat.id}`, { state: { categoryName: cat.name } })}
                  style={{
                    background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
                    padding: cat.image ? 0 : '28px 16px', textAlign: 'center', boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition)', overflow: 'hidden',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  {cat.image ? (
                    <>
                      <img src={cat.image} alt={cat.name} loading="lazy" style={{ width: '100%', aspectRatio: 1, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '14px 12px' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                        {cat.count != null && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{cat.count} services</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 34, marginBottom: 10 }}>{cat.icon || '💆'}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{cat.name}</div>
                      {cat.count != null && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{cat.count} services</div>}
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
