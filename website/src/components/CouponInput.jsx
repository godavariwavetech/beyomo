import React, { useState } from 'react';
import { applyCoupon } from '../api/coupons';
import { useAuth } from '../context/AuthContext';

export default function CouponInput({ orderAmount, appliedCoupon, onApply, onRemove }) {
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await applyCoupon(code.trim().toUpperCase(), orderAmount, token);
      onApply(res.data);
      setCode('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#D1FAE5', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>🎟 {appliedCoupon.code} applied</div>
          <div style={{ fontSize: 12, color: '#065F46' }}>You saved ₹{appliedCoupon.discountAmount}</div>
        </div>
        <button onClick={onRemove} style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>Remove</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          className="form-input"
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ flex: 1, textTransform: 'uppercase' }}
        />
        <button className="btn btn-secondary btn-sm" onClick={handleApply} disabled={loading || !code.trim()}>
          {loading ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
