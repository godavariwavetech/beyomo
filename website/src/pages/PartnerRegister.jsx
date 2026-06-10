import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_CATEGORIES = [
  { id: 'hair-basic',      name: 'Hair Basic',       icon: '💇', skills: ['Basic HairCut','Henna','HairSpa','Head Massage','HairColor','Lice Treatment'] },
  { id: 'skin-basic',      name: 'Skin Basic',        icon: '✨', skills: ['DeTan','PeelOff','Facial','Waxing','Pedicure','Manicure','Face Massage'] },
  { id: 'hair-advanced',   name: 'Hair Advanced',     icon: '✂️', skills: ['Creative HairCut','Hair Setting','Ironing','Fashion Color'] },
  { id: 'waxing',          name: 'Waxing',            icon: '🌸', skills: ['Honey Waxing','Rica Waxing','Brazilian','B Waxing'] },
  { id: 'skin-treatment',  name: 'Skin Treatment',    icon: '💆', skills: ['Wart Removal','Skin Tightening'] },
  { id: 'makeup',          name: 'Makeup',            icon: '💄', skills: ['HairDo','Saree Draping','Bride Makeup','Groom Makeup','Preplating'] },
  { id: 'mehendi',         name: 'Mehendi',           icon: '🌺', skills: ['Bridal Mehendi','Party Mehendi','Simple Mehendi'] },
  { id: 'nails',           name: 'Nails',             icon: '💅', skills: ['Nail Art','Gel Nails','Nail Extension','Nail Polish'] },
  { id: 'hair-treatments', name: 'Hair Treatments',   icon: '🧴', skills: ['Botox','Keratin','Straightening','NanoPlastia','Hairfall Treatment','Dandruff Treatment'] },
  { id: 'massage',         name: 'Massage',           icon: '🛀', skills: ['Foot Massage','Back Massage','Body Massage','Body Polish'] },
  { id: 'aesthetics',      name: 'Aesthetics',        icon: '⚗️', skills: ['Hydra Facial','Medi Facials','Micro Blading','Eyelash','BB Glow','Lip Coloring','Chemical Peels','PRP / GFC','Glutathione','Derma Planing'] },
  { id: 'laser',           name: 'Laser',             icon: '🔬', skills: ['Laser Hair Removal','Laser Skin Treatment','Laser Tattoo Removal'] },
  { id: 'mens',            name: "Men's Services",    icon: '👨', skills: ['Hair','Skin','Makeup','Massage'] },
];

function StepBar({ current, total }) {
  const labels = ['Basic Info', 'Categories', 'Skills'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const done = current > n;
        const active = current === n;
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? '#22C55E' : active ? 'var(--primary)' : '#e2e8f0',
                color: done || active ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
              }}>
                {done ? '✓' : n}
              </div>
              <div style={{ fontSize: 12, marginTop: 6, fontWeight: active ? 700 : 400, color: active ? 'var(--primary)' : done ? '#22C55E' : '#94a3b8', whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 2, background: current > n ? '#22C55E' : '#e2e8f0', margin: '0 8px', marginBottom: 24, transition: 'background 0.3s' }} />
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

export default function PartnerRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', experience: '' });
  const [errors, setErrors] = useState({});
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetch('/api/v1/services/categories')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const cats = data?.data;
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon || '',
            skills: [],
          })));
          // Fetch services to get skills per category
          return fetch('/api/v1/services?limit=500').then(r => r.ok ? r.json() : null).then(sd => {
            const svcs = sd?.data?.data ?? sd?.data ?? [];
            if (svcs.length > 0) {
              setCategories(cats.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon || '',
                skills: svcs.filter(s => s.categoryId === c.id).map(s => s.name),
              })));
            }
          });
        }
      })
      .catch(() => {}); // silently fall back to hardcoded list
  }, []);

  const f = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validateStep1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (selectedCats.length === 0) { setApiError('Please select at least one category.'); return; }
      setApiError('');
      // Prune skills from deselected cats
      const validSkills = categories.filter(c => selectedCats.includes(c.id)).flatMap(c => c.skills);
      setSelectedSkills(p => p.filter(s => validSkills.includes(s)));
      setStep(3);
    }
  };

  const toggleCat = (id) => {
    setSelectedCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
    setApiError('');
  };

  const toggleSkill = (skill) => setSelectedSkills(p => p.includes(skill) ? p.filter(s => s !== skill) : [...p, skill]);

  const submit = async () => {
    setSubmitting(true);
    setApiError('');
    try {
      const res = await fetch('/api/v1/auth/partner-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          city: form.city.trim() || null,
          experience: parseInt(form.experience) || 0,
          categories: selectedCats,
          skills: selectedSkills,
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
            {['Our team reviews your application','We schedule a quick verification call','You complete onboarding & go live'].map((s, i) => (
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
      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg,var(--dark),var(--teal))', padding: '48px 0 56px' }}>
        <div className="container">
          <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>For Professionals</div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: 'white', marginBottom: 12 }}>Join Beyomo as a Professional</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 560, lineHeight: 1.65 }}>
            Earn ₹20,000–₹55,000/month on your own schedule. Thousands of customers are already booking in your city.
          </p>
          <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
            {[['💰','Earn More'],['📅','Your Schedule'],['🛡️','Verified Badge'],['📱','Easy App']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                <span style={{ fontSize: 18 }}>{icon}</span> {label}
              </div>
            ))}
          </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="City" error={errors.city}>
                  <input className="form-input" placeholder="e.g. Hyderabad" value={form.city} onChange={e => f('city', e.target.value)} />
                </Field>
                <Field label="Experience (years)">
                  <input className="form-input" placeholder="e.g. 3" value={form.experience} onChange={e => f('experience', e.target.value)} type="number" min="0" />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 2: Categories ── */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>What do you specialise in?</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Select all categories that apply. You can offer services in multiple areas.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {categories.map(cat => {
                  const active = selectedCats.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCat(cat.id)}
                      style={{
                        border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                        background: active ? '#EFF6FF' : 'white', cursor: 'pointer',
                        transition: 'all 0.15s', position: 'relative',
                      }}
                    >
                      {active && (
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>✓</div>
                      )}
                      {cat.icon && <div style={{ fontSize: 24, marginBottom: 8, lineHeight: 1 }}>{cat.icon}</div>}
                      <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--text)', lineHeight: 1.3 }}>{cat.name}</div>
                    </button>
                  );
                })}
              </div>
              {selectedCats.length > 0 && (
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                  {selectedCats.length} categor{selectedCats.length === 1 ? 'y' : 'ies'} selected
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Skills ── */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Pick your specific skills</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Select the services you're confident offering to customers.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {categories.filter(c => selectedCats.includes(c.id)).map(cat => (
                  <div key={cat.id}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {cat.icon && <span>{cat.icon}</span>} {cat.name}
                    </div>
                    {cat.skills.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No specific skills listed for this category.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {cat.skills.map(skill => {
                          const checked = selectedSkills.includes(skill);
                          return (
                            <label
                              key={skill}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '7px 14px',
                                border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: 'var(--r-full)',
                                background: checked ? '#EFF6FF' : 'white',
                                cursor: 'pointer', fontSize: 13,
                                fontWeight: checked ? 600 : 400,
                                color: checked ? 'var(--primary)' : 'var(--text)',
                                transition: 'all 0.15s', userSelect: 'none',
                              }}
                            >
                              <input type="checkbox" checked={checked} onChange={() => toggleSkill(skill)} style={{ display: 'none' }} />
                              {checked && <span style={{ fontSize: 11 }}>✓</span>}
                              {skill}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {selectedSkills.length > 0 && (
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
                  {selectedSkills.length} skill{selectedSkills.length === 1 ? '' : 's'} selected
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {apiError && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 14, color: '#DC2626' }}>
              {apiError}
            </div>
          )}

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { setApiError(''); if (step === 1) window.history.back(); else setStep(s => s - 1); }}
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0' }}
            >
              ← {step === 1 ? 'Back to Home' : 'Back'}
            </button>
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={next} style={{ minWidth: 120 }}>
                Next →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={submit}
                disabled={submitting}
                style={{ minWidth: 160, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32, flexWrap: 'wrap' }}>
          {[['🔒','Secure & Private'],['⚡','Quick Response'],['📞','Dedicated Support']].map(([icon, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)' }}>
              <span style={{ fontSize: 18 }}>{icon}</span> {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
