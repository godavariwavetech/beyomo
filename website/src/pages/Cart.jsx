import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&q=80';

export default function Cart() {
  const { items, subtotal, incrementItem, decrementItem, removeItem } = useCart();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-hero page-hero-compact">
        <div className="container page-hero-inner">
          <span className="badge">Your Cart</span>
          <h1>{items.length > 0 ? `${items.length} service${items.length === 1 ? '' : 's'} selected` : 'Your cart is empty'}</h1>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ShoppingBag size={48} color="var(--muted)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--muted)', marginBottom: 20 }}>You haven't added any services yet.</p>
              <Link to="/services" className="btn btn-primary">Browse Services →</Link>
            </div>
          ) : (
            <div className="cart-grid">
              <div>
                {items.map((i) => (
                  <div key={i.id} className="cart-item-row">
                    <img
                      src={i.image || FALLBACK_IMG}
                      alt={i.name}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMG; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cart-item-name">{i.name}</div>
                      {i.duration && <div className="cart-item-meta">{i.duration} mins</div>}
                      <div className="cart-item-price">₹{i.price}</div>
                    </div>
                    <div className="cart-item-stepper">
                      <button onClick={() => decrementItem(i.id)} aria-label="Decrease quantity"><Minus size={14} /></button>
                      <span>{i.qty}</span>
                      <button onClick={() => incrementItem(i.id)} aria-label="Increase quantity"><Plus size={14} /></button>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeItem(i.id)} aria-label="Remove item"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="cart-summary-card">
                <h3>Order Summary</h3>
                <div className="cart-summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Taxes &amp; platform fee are calculated at checkout.</p>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18 }} onClick={() => navigate('/checkout')}>
                  Proceed to Checkout →
                </button>
                <Link to="/services" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  + Add more services
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
