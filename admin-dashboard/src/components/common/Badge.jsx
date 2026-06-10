import React from 'react';

const MAP = {
  active:      'badge-active',
  suspended:   'badge-suspended',
  pending:     'badge-pending',
  completed:   'badge-completed',
  cancelled:   'badge-cancelled',
  inactive:    'badge-inactive',
  'in-progress': 'badge-in-progress',
  assigned:    'badge-assigned',
  online:      'badge-online',
  offline:     'badge-offline',
  approved:    'badge-active',
  flagged:     'badge-suspended',
  scheduled:   'badge-info',
  expired:     'badge-offline',
  sent:        'badge-active',
  verified:    'badge-verified',
  success:     'badge-success',
  warning:     'badge-warning',
  danger:      'badge-danger',
};

export function Badge({ status, label }) {
  const cls = MAP[status] || 'badge-offline';
  const text = label || (status ? status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') : '');
  return <span className={`badge ${cls}`}>{text}</span>;
}

export function StarRating({ rating, size = 14 }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={rating >= n ? 'star-filled' : 'star-empty'}>★</span>
      ))}
      <span className="rating-label">{rating.toFixed(1)}</span>
    </div>
  );
}
