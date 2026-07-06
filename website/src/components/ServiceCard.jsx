import React from 'react';
import { Clock } from 'lucide-react';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80';

export default function ServiceCard({ service, qty, onIncrement, onDecrement }) {
  return (
    <div className="service-card">
      <img
        src={service.image || FALLBACK_IMG}
        alt={service.name}
        loading="lazy"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
      />
      <div className="service-card-body">
        <div className="service-card-title">{service.name}</div>
        {service.duration && (
          <div className="service-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {service.duration} mins
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div>
            <span className="service-card-price">₹{service.price}</span>
            {service.originalPrice && service.originalPrice > service.price && (
              <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', marginLeft: 8 }}>
                ₹{service.originalPrice}
              </span>
            )}
          </div>
          {!qty ? (
            <button
              onClick={onIncrement}
              style={{
                padding: '8px 18px', borderRadius: 'var(--r-full)', background: 'var(--primary)',
                color: 'white', fontSize: 13, fontWeight: 700,
              }}
            >
              Add
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--light)', borderRadius: 'var(--r-full)', padding: '4px 8px' }}>
              <button onClick={onDecrement} style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', boxShadow: 'var(--shadow-sm)', fontWeight: 800 }}>−</button>
              <span style={{ fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{qty}</span>
              <button onClick={onIncrement} style={{ width: 26, height: 26, borderRadius: '50%', background: 'white', boxShadow: 'var(--shadow-sm)', fontWeight: 800 }}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
