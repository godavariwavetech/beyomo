import React from 'react';
import { MapPin, Check, X } from 'lucide-react';
import { useCity } from '../context/CityContext';

export default function CitySelectorModal({ open, onClose, onSelected }) {
  const { cities, citiesLoading, citiesError, city, setCity } = useCity();

  if (!open) return null;

  const select = (c) => {
    setCity(c);
    onSelected?.(c);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)',
          width: '100%', maxWidth: 420, maxHeight: '80vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Select Your City</h3>
          <button onClick={onClose} style={{ color: 'var(--muted)', lineHeight: 1, display: 'flex' }} aria-label="Close"><X size={20} /></button>
        </div>
        <div style={{ padding: '12px 16px', overflowY: 'auto' }}>
          {citiesLoading && <p style={{ padding: 16, color: 'var(--muted)', fontSize: 14 }}>Loading cities…</p>}
          {citiesError && <p style={{ padding: 16, color: '#EF4444', fontSize: 14 }}>{citiesError}</p>}
          {!citiesLoading && !citiesError && cities.length === 0 && (
            <p style={{ padding: 16, color: 'var(--muted)', fontSize: 14 }}>No cities available right now.</p>
          )}
          {cities.map((c) => {
            const active = city?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => select(c)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 12px', borderRadius: 'var(--r-md)', textAlign: 'left',
                  background: active ? 'var(--light)' : 'transparent',
                  border: active ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                  marginBottom: 4, transition: 'background 0.15s',
                }}
                onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'var(--light)'; }}
                onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', color: 'var(--primary)' }}><MapPin size={18} /></span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{c.name}</div>
                  {c.state && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.state}</div>}
                </div>
                {active && <span style={{ marginLeft: 'auto', color: 'var(--primary)', display: 'flex' }}><Check size={18} strokeWidth={3} /></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
