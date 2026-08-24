import React, { useEffect } from 'react';
import { PieChart, Lock } from 'lucide-react';

const DEFAULT_ADMIN = 20;
const DEFAULT_GST   = 5;

// Admin and partner cut are two halves of the same 100% — only the admin cut is
// editable and the partner's share is derived from it, so the two can never be saved
// out of sync (an 80/80 split used to be perfectly acceptable to this form).
const clampAdmin = (raw) => {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
};

// Single source of truth for what a form posts as its revenue split: the partner cut is
// always derived, never read back from form state, so a stale/invalid stored value can't
// survive a save even if the user never touched the field.
export const revenueSplitPayload = (form, gstDefault = DEFAULT_GST) => {
  const adminPercent = clampAdmin(form.adminPercent) ?? DEFAULT_ADMIN;
  return {
    adminPercent,
    partnerPercent: parseFloat((100 - adminPercent).toFixed(2)),
    gstPercent: parseFloat(form.gstPercent ?? gstDefault) || 0,
  };
};

const RevenueSplitFields = ({ form, setForm }) => {
  const admin   = clampAdmin(form.adminPercent) ?? DEFAULT_ADMIN;
  const partner = parseFloat((100 - admin).toFixed(2));
  const gst     = parseFloat(form.gstPercent ?? DEFAULT_GST) || 0;

  // Keep the derived value in form state (that's what the save handlers post) and
  // repair legacy rows whose stored split doesn't add up the moment they're opened.
  useEffect(() => {
    const stored = parseFloat(form.partnerPercent);
    if (stored === partner) return;
    setForm(f => ({ ...f, partnerPercent: partner }));
  }, [partner, form.partnerPercent, setForm]);

  return (
    <div style={{ marginTop: 12 }}>
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <PieChart size={14} /> Revenue Split & GST
      </label>

      <div className="form-grid form-grid-3" style={{ gap: 10 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>Admin Cut (%)</label>
          <input
            className="form-input"
            type="number" min="0" max="100" step="0.01"
            placeholder={String(DEFAULT_ADMIN)}
            value={form.adminPercent ?? ''}
            onChange={e => {
              const next = clampAdmin(e.target.value);
              setForm(f => ({
                ...f,
                adminPercent: next == null ? e.target.value : next,
                partnerPercent: parseFloat((100 - (next ?? DEFAULT_ADMIN)).toFixed(2)),
              }));
            }}
            onBlur={e => {
              // Empty/garbage input falls back to the default rather than leaving the
              // pair in a state the derived partner cut can't describe.
              const next = clampAdmin(e.target.value) ?? DEFAULT_ADMIN;
              setForm(f => ({ ...f, adminPercent: next, partnerPercent: parseFloat((100 - next).toFixed(2)) }));
            }}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            Partner Cut (%) <Lock size={10} />
          </label>
          <input
            className="form-input"
            type="number"
            value={partner}
            readOnly
            disabled
            tabIndex={-1}
            title="Automatically calculated as 100% − Admin Cut"
            style={{ background: 'var(--c-bg-subtle, #F3F4F6)', cursor: 'not-allowed' }}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: 11 }}>GST (%)</label>
          <input
            className="form-input"
            type="number" min="0" max="100" step="0.01"
            placeholder={String(DEFAULT_GST)}
            value={form.gstPercent ?? ''}
            onChange={e => setForm(f => ({ ...f, gstPercent: e.target.value }))}
          />
        </div>
      </div>

      {/* Visual bar */}
      <div style={{ marginTop: 10, borderRadius: 6, overflow: 'hidden', height: 10, display: 'flex', background: 'var(--c-border)' }}>
        <div style={{ width: `${admin}%`, background: 'var(--c-brand-teal-mid)', transition: 'width 0.2s' }} title={`Admin ${admin}%`} />
        <div style={{ width: `${partner}%`, background: '#C49738', transition: 'width 0.2s' }} title={`Partner ${partner}%`} />
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 5, fontSize: 11, color: 'var(--c-text-secondary)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: 'var(--c-brand-teal-mid)', marginRight: 4 }} />Admin {admin}%</span>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: '#C49738', marginRight: 4 }} />Partner {partner}%</span>
        <span style={{ marginLeft: 'auto' }}>GST {gst}%</span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--c-text-muted)' }}>
        Partner cut is calculated automatically — set the admin cut and the rest goes to the partner.
      </p>
    </div>
  );
};

export default RevenueSplitFields;
