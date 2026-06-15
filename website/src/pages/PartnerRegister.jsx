import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const STEP_LABELS = ['Basic Info', 'Categories', 'Skills', 'Documents'];

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: done ? '#22C55E' : active ? 'var(--primary)' : '#e2e8f0',
                color: done || active ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, transition: 'all 0.2s',
              }}>
                {done ? '✓' : n}
              </div>
              <div style={{ fontSize: 11, marginTop: 5, fontWeight: active ? 700 : 400, color: active ? 'var(--primary)' : done ? '#22C55E' : '#94a3b8', whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: current > n ? '#22C55E' : '#e2e8f0', margin: '0 6px', marginBottom: 22, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

function ChipGrid({ items, selected, onToggle, emptyMsg }) {
  if (!items.length) return <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>{emptyMsg}</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
      {items.map(item => {
        const active = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            style={{
              border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 12, padding: '14px 10px', textAlign: 'center',
              background: active ? '#EFF6FF' : 'white', cursor: 'pointer',
              transition: 'all 0.15s', position: 'relative',
            }}>
            {active && (
              <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>✓</div>
            )}
            {item.icon && <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>}
            <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--text)', lineHeight: 1.3 }}>{item.name}</div>
          </button>
        );
      })}
    </div>
  );
}

function ImageUploadBox({ label, hint, value, onChange, icon = '📷' }) {
  const inputRef = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ uri: reader.result, file });
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        {label} <span style={{ color: '#EF4444' }}>*</span>
      </div>
      <div
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${value ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 12,
          background: value ? '#EFF6FF' : '#fafafa',
          minHeight: 110,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 8, cursor: 'pointer', position: 'relative', overflow: 'hidden',
          transition: 'all 0.15s',
        }}>
        {value ? (
          <>
            <img src={value.uri} alt={label} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }} />
            <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'var(--primary)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              ✓ Uploaded
            </div>
          </>
        ) : (
          <>
            <span style={{ fontSize: 28 }}>{icon}</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Click to upload</div>
            {hint && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{hint}</div>}
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      {value && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }}
          style={{ marginTop: 6, fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Remove
        </button>
      )}
    </div>
  );
}

export default function PartnerRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', cityId: '', experience: '' });
  const [errors, setErrors] = useState({});

  // Step 2: Service categories (from Services admin section)
  const [serviceCategories, setServiceCategories] = useState([]);
  const [selectedServiceCats, setSelectedServiceCats] = useState([]);

  // Step 3: Skill categories (from Skills admin section)
  const [skillCategories, setSkillCategories] = useState([]);
  const [selectedSkillCats, setSelectedSkillCats] = useState([]);

  const [cities, setCities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  // Step 4: Documents
  const [selfie, setSelfie] = useState(null);
  const [aadhar, setAadhar] = useState(null);
  const [signedAgreement, setSignedAgreement] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [catRes, skillRes, cityRes] = await Promise.all([
          fetch('/api/v1/services/categories').then(r => r.ok ? r.json() : null),
          fetch('/api/v1/skills/categories').then(r => r.ok ? r.json() : null),
          fetch('/api/v1/cities/active').then(r => r.ok ? r.json() : null),
        ]);
        if (catRes?.data?.length > 0) setServiceCategories(catRes.data.filter(c => c.isActive !== false));
        if (skillRes?.data?.length > 0) setSkillCategories(skillRes.data.filter(c => c.isActive !== false));
        if (cityRes?.data?.length > 0) setCities(cityRes.data);
      } catch { }
      setLoadingData(false);
    };
    fetchAll();
  }, []);

  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.cityId) e.cityId = 'Please select your city';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep4 = () => {
    if (!selfie) { setApiError('Please upload your selfie photo.'); return false; }
    if (!aadhar) { setApiError('Please upload your Aadhar card image.'); return false; }
    if (!signedAgreement) { setApiError('Please download, sign, and upload the agreement.'); return false; }
    return true;
  };

  const next = () => {
    setApiError('');
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (selectedServiceCats.length === 0) { setApiError('Please select at least one category.'); return; }
      setStep(3);
    } else if (step === 3) {
      if (selectedSkillCats.length === 0) { setApiError('Please select at least one skill.'); return; }
      setStep(4);
    }
  };

  const downloadAgreement = () => {
    const a = document.createElement('a');
    a.href = '/api/v1/partners/agreement.pdf';
    a.download = 'Beyomo_Partner_Agreement.pdf';
    a.click();
  };

  const submit = async () => {
    if (!validateStep4()) return;
    setSubmitting(true);
    setApiError('');
    const city = cities.find(c => c.id === parseInt(form.cityId));
    try {
      const res = await fetch('/api/v1/auth/partner-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          cityId: parseInt(form.cityId) || null,
          city: city?.name || null,
          experience: parseInt(form.experience) || 0,
          serviceCategoryIds: selectedServiceCats,
          skillCategoryIds: selectedSkillCats,
          selfie: selfie?.uri || null,
          aadhar: aadhar?.uri || null,
          agreement: signedAgreement?.uri || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setDone(true);
      } else {
        setApiError(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--light)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 68 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '56px 48px', maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', margin: '0 16px' }}>
          <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Application Submitted!</h2>
          <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 32 }}>
            Thank you for applying to join Beyomo! Our team will review your application and contact you at <strong>{form.phone}</strong> within 2–3 business days.
          </p>
          <div style={{ background: 'var(--light)', borderRadius: 16, padding: '20px 24px', marginBottom: 32, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>What happens next?</div>
            {['Our team reviews your application', 'We schedule a quick verification call', 'You complete onboarding & go live'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 14, color: 'var(--muted)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
          <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--light)', paddingTop: 68 }}>
      <div style={{ background: 'linear-gradient(135deg,var(--dark),var(--teal))', padding: '48px 0 56px' }}>
        <div className="container">
          <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>For Professionals</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: 'white', marginBottom: 12 }}>Join Beyomo as a Professional</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 560, lineHeight: 1.65 }}>
            Earn ₹20,000–₹55,000/month on your own schedule. Thousands of customers are already booking in your city.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 680, paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '36px 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <StepBar current={step} />

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Tell us about yourself</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>We'll use this to create your professional profile.</p>

              <Field label="Full Name" required error={errors.name}>
                <input className="form-input" placeholder="e.g. Sonal Kapoor" value={form.name} onChange={e => f('name', e.target.value)} />
              </Field>
              <Field label="Phone Number" required error={errors.phone}>
                <input className="form-input" placeholder="10-digit mobile number" value={form.phone} onChange={e => f('phone', e.target.value)} maxLength={10} type="tel" />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input className="form-input" placeholder="partner@gmail.com" value={form.email} onChange={e => f('email', e.target.value)} type="email" />
              </Field>
              <Field label="City" required error={errors.cityId}>
                {loadingData ? (
                  <div className="form-input" style={{ color: 'var(--muted)' }}>Loading cities…</div>
                ) : (
                  <select className="form-input" value={form.cityId} onChange={e => f('cityId', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select your city</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}{c.state ? `, ${c.state}` : ''}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Experience (years)">
                <input className="form-input" placeholder="e.g. 3" value={form.experience} onChange={e => f('experience', e.target.value)} type="number" min="0" />
              </Field>
            </div>
          )}

          {/* ── Step 2: Service Categories ── */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>What service areas do you work in?</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Select the service categories you offer to customers.</p>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>Loading categories…</div>
              ) : (
                <ChipGrid
                  items={serviceCategories}
                  selected={selectedServiceCats}
                  onToggle={id => { setSelectedServiceCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]); setApiError(''); }}
                  emptyMsg="No categories found. Please contact support."
                />
              )}
              {selectedServiceCats.length > 0 && (
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                  {selectedServiceCats.length} categor{selectedServiceCats.length === 1 ? 'y' : 'ies'} selected
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Skill Categories ── */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>What are your skills?</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Select your areas of expertise from the list below.</p>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>Loading skills…</div>
              ) : (
                <ChipGrid
                  items={skillCategories}
                  selected={selectedSkillCats}
                  onToggle={id => { setSelectedSkillCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]); setApiError(''); }}
                  emptyMsg="No skills found. Please contact support."
                />
              )}
              {selectedSkillCats.length > 0 && (
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                  {selectedSkillCats.length} skill{selectedSkillCats.length === 1 ? '' : 's'} selected
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Documents ── */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Upload Your Documents</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
                All documents are required for identity verification. Your data is securely stored.
              </p>

              <div style={{
                background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
                border: '1.5px solid #93C5FD',
                borderRadius: 14, padding: '18px 20px', marginBottom: 24,
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E40AF', marginBottom: 6 }}>📄 Partner Agreement</div>
                <p style={{ fontSize: 13, color: '#3B82F6', marginBottom: 14, lineHeight: 1.55 }}>
                  Download the agreement PDF, print and sign it, then upload a clear photo of the signed document below.
                </p>
                <button type="button" onClick={downloadAgreement}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ⬇ Download Agreement PDF
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <ImageUploadBox label="Your Selfie" hint="Clear face photo (no sunglasses)" icon="🤳" value={selfie} onChange={setSelfie} />
                <ImageUploadBox label="Aadhar Card" hint="Front side, clearly visible" icon="🪪" value={aadhar} onChange={setAadhar} />
                <ImageUploadBox label="Signed Agreement" hint="Photo of printed & signed agreement" icon="✍️" value={signedAgreement} onChange={setSignedAgreement} />
              </div>
            </div>
          )}

          {apiError && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 14, color: '#DC2626' }}>
              {apiError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <button type="button"
              onClick={() => { setApiError(''); if (step === 1) window.history.back(); else setStep(s => s - 1); }}
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0' }}>
              ← {step === 1 ? 'Back to Home' : 'Back'}
            </button>
            {step < 4 ? (
              <button type="button" className="btn btn-primary" onClick={next} style={{ minWidth: 120 }}>
                Next →
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={submit} disabled={submitting} style={{ minWidth: 160, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
          {[['🔒', 'Secure & Private'], ['⚡', 'Quick Response'], ['📞', 'Dedicated Support']].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontSize: 18 }}>{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
