import React from 'react';
import { PieChart } from 'lucide-react';

const RevenueSplitFields = ({ form, setForm }) => {
  const admin   = parseFloat(form.adminPercent   ?? 20) || 0;
  const partner = parseFloat(form.partnerPercent ?? 80) || 0;
  const gst     = parseFloat(form.gstPercent     ?? 5) || 0;
  const splitSum = admin + partner;
  const splitOk  = Math.abs(splitSum - 100) < 0.01;

  return (
    <div style={{ marginTop: 12 }}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <PieChart size={14} /> Revenue Split & GST
      </label>

      {/* Three inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>Admin Cut (%)</label>
          <input
            className="form-input"
            type="number" min="0" max="100" step="0.01"
            placeholder="20"
            value={form.adminPercent ?? ''}
            onChange={e => setForm(f => ({ ...f, adminPercent: e.target.value }))}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>Partner Cut (%)</label>
          <input
            className="form-input"
            type="number" min="0" max="100" step="0.01"
            placeholder="80"
            value={form.partnerPercent ?? ''}
            onChange={e => setForm(f => ({ ...f, partnerPercent: e.target.value }))}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>GST (%)</label>
          <input
            className="form-input"
            type="number" min="0" max="100" step="0.01"
            placeholder="5"
            value={form.gstPercent ?? ''}
            onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))}
          />
        </div>
      </div>

      {/* Visual bar */}
      <div style={{ marginTop: 10, borderRadius: 6, overflow: 'hidden', height: 10, display: 'flex', background: 'var(--c-border)' }}>
        <div style={{ width: `${Math.min(admin, 100)}%`, background: 'var(--c-brand-teal-mid)', transition: 'width 0.2s' }} title={`Admin ${admin}%`} />
        <div style={{ width: `${Math.min(partner, 100 - admin)}%`, background: '#C49738', transition: 'width 0.2s' }} title={`Partner ${partner}%`} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 5, fontSize: 11, color: 'var(--c-text-secondary)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: 'var(--c-brand-teal-mid)', marginRight: 4 }} />Admin {admin}%</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: '#C49738', marginRight: 4 }} />Partner {partner}%</span>
        <span style={{ marginLeft: 'auto' }}>GST {gst}%</span>
        {!splitOk && (
          <span style={{ color: 'var(--c-danger)', fontWeight: 600 }}>
            ⚠ Admin + Partner = {splitSum.toFixed(1)}% (should be 100%)
          </span>
        )}
        {splitOk && <span style={{ color: 'var(--c-success)', fontWeight: 600 }}>✓ Split valid</span>}
      </div>
    </div>
  );
};

export default RevenueSplitFields;
