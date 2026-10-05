import React, {useState} from 'react';
import {formatRupee} from '../../utils/format';
import './OrderPackages.css';

export default function OrderPackages({catalog, services, value, onChange}) {
  const [picking, setPicking] = useState(null);
  const [picks, setPicks] = useState([]);
  const add = (pkg, serviceIds) => {
    if (!serviceIds.length) return;
    onChange([...value, {pkg, serviceIds, qty: 1}]);
    setPicking(null); setPicks([]);
  };
  const available = picking ? services.filter(s => {
    const curated = (picking.services || []).map(item => Number(item.serviceId));
    return curated.length ? curated.includes(Number(s.id)) : !picking.categoryId || Number(s.categoryId) === Number(picking.categoryId);
  }) : [];
  const required = picking?.serviceCount || 1;
  return <>
    {['fixed', 'flexible'].map(type => {
      const label = type === 'fixed' ? 'Combo' : 'Package';
      const options = catalog.filter(p => p.packageType === type && !value.some(item => item.pkg.id === p.id));
      return <div key={type} style={{marginBottom:12}}>
        <label className="form-label" htmlFor={`booking-${type}`}>{label === 'Combo' ? 'Combos' : 'Packages'}</label>
        <select id={`booking-${type}`} className="form-input" value="" disabled={!options.length} onChange={e => {
          const pkg = options.find(p => String(p.id) === e.target.value);
          if (!pkg) return;
          if (type === 'fixed') add(pkg, pkg.services.map(s => s.serviceId));
          else {setPicking(pkg); setPicks([]);}
        }}>
          <option value="">{options.length ? `Add a ${label.toLowerCase()}…` : `No additional ${label.toLowerCase()}s available in this city`}</option>
          {options.map(p => <option key={p.id} value={p.id}>
            {p.title} — {formatRupee(p.price)}{type === 'flexible' ? ` · Choose ${p.serviceCount || 1} services` : ''}
          </option>)}
        </select>
      </div>;
    })}
    {picking && <div className="booking-package-picker">
      <div className="booking-package-heading">
        <div><strong>{picking.title}</strong><div className="booking-package-caption">Choose {required} services</div></div>
        <span className="booking-package-tag">{picks.length} / {required} selected</span>
      </div>
      <div className="booking-package-options">
        {available.map(s => <label key={s.id} className="booking-package-option">
          <input type="checkbox" checked={picks.includes(s.id)} disabled={!picks.includes(s.id) && picks.length >= required}
            onChange={() => setPicks(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} /> {s.name}
        </label>)}
      </div>
      <div className="booking-package-actions">
        <button className="btn btn-primary btn-sm" disabled={picks.length !== required} onClick={() => add(picking, picks)}>Add Package</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setPicking(null)}>Cancel</button>
      </div>
    </div>}
    {value.length > 0 && <div className="booking-package-list">
      <div className="booking-package-caption">Added combos & packages ({value.length})</div>
      {value.map((item, index) => <div key={item.pkg.id} className="booking-package-card">
        <div className="booking-package-heading">
          <div className="booking-package-title">
            <span className="booking-package-tag">{item.pkg.packageType === 'fixed' ? 'Combo' : 'Package'}</span>
            <strong>{item.pkg.title}</strong>
          </div>
          <div className="booking-package-price">
            <strong>{formatRupee(Number(item.pkg.price) * item.qty)}</strong>
            {Number(item.pkg.originalPrice) > Number(item.pkg.price) && <span className="booking-package-original">{formatRupee(Number(item.pkg.originalPrice) * item.qty)}</span>}
          </div>
        </div>
        <div className="booking-package-caption">{item.serviceIds.length} included services · {formatRupee(item.pkg.price)} each</div>
        <ul className="booking-package-services">
          {item.serviceIds.map(id => <li key={id}>{services.find(s => Number(s.id) === Number(id))?.name || item.pkg.services?.find(s => Number(s.serviceId) === Number(id))?.name || `Service ${id}`}</li>)}
        </ul>
        <div className="booking-package-footer">
          <label className="booking-package-quantity">Quantity
            <input className="form-input" type="number" min="1" max="5" value={item.qty}
              onChange={e => onChange(value.map((entry, i) => i === index ? {...entry, qty: Math.max(1, Math.min(5, Number(e.target.value) || 1))} : entry))} />
          </label>
          <button className="btn btn-outline btn-sm" aria-label={`Remove ${item.pkg.title}`} onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove</button>
        </div>
      </div>)}
    </div>}
  </>;
}
