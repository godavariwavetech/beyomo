import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartBar() {
  const { items, count, subtotal } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 90,
        background: 'white', borderTop: '2px solid var(--primary)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.1)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{count} {count === 1 ? 'item' : 'items'} · ₹{subtotal}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Excludes taxes &amp; platform fee</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Book Now →</button>
      </div>
    </div>
  );
}
