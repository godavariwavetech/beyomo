import React from 'react';

const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function validateSlot(isoString) {
  if (!isoString) return 'Please select a date and time.';
  const date = new Date(isoString);
  const diff = date.getTime() - Date.now();
  if (diff < ONE_HOUR_MS) return 'Booking must be at least 1 hour from now.';
  if (diff > THIRTY_DAYS_MS) return 'Booking cannot be more than 30 days in advance.';
  return null;
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SlotPicker({ value, onChange, error }) {
  const min = new Date(Date.now() + ONE_HOUR_MS);
  const max = new Date(Date.now() + THIRTY_DAYS_MS);

  return (
    <div>
      <label className="form-label">Schedule Date &amp; Time</label>
      <input
        type="datetime-local"
        className="form-input"
        value={value || ''}
        min={toLocalInputValue(min)}
        max={toLocalInputValue(max)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
