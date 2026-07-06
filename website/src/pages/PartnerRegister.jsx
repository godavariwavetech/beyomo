import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, IndianRupee, Users, MapPinned, ShieldCheck, Clock, Headset } from 'lucide-react';
import { API_BASE_URL } from '../config';

const STATS = [
  { icon: IndianRupee, value: '₹20k–55k', label: 'Earning Potential / Month' },
  { icon: Users, value: '1000+', label: 'Active Professionals' },
  { icon: MapPinned, value: '8+', label: 'Cities & Growing' },
];

const PERKS = [
  { icon: ShieldCheck, label: 'Verified & Trusted Platform' },
  { icon: Clock, label: 'Work On Your Own Schedule' },
  { icon: Headset, label: 'Dedicated Partner Support' },
];

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
  const [form, setForm] = useState({ name: '', phone: '', email: '', cityId: '', otherCity: '', experience: '', interest: '' });
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/cities/active`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => { if (res?.data?.length > 0) setCities(res.data); })
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  }, []);

  const f = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })); };

  const isOtherCity = form.cityId === 'other';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.cityId) e.cityId = 'Please select your city';
    if (isOtherCity && !form.otherCity.trim()) e.otherCity = 'Please tell us your city';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');
    const city = cities.find((c) => c.id === parseInt(form.cityId));
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/partner-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          cityId: isOtherCity ? null : (parseInt(form.cityId) || null),
          city: isOtherCity ? form.otherCity.trim() : (city?.name || null),
          experience: parseInt(form.experience) || 0,
          serviceCategoryIds: [],
          skillCategoryIds: [],
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
          <div style={{ width: 80, height: 80, background: 'rgba(16,86,65,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Sparkles size={36} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Thanks for Your Interest!</h2>
          <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 32 }}>
            We've received your details. Our partner team will call you at <strong>{form.phone}</strong> within 2–3 business days to walk you through onboarding.
          </p>
          <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--light)', paddingTop: 68 }}>
      <div className="page-hero">
        <div className="container page-hero-inner" style={{ textAlign: 'center' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>For Beauty &amp; Wellness Professionals</span>
          <h1 style={{ margin: '14px auto 0' }}>Grow Your Business With Beyomo</h1>
          <p style={{ margin: '0 auto', maxWidth: 560 }}>
            Join thousands of verified professionals earning flexibly on their own schedule. Tell us a little about yourself — we'll take it from there.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 36 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                borderRadius: 'var(--r-lg)', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 200,
              }}>
                <s.icon size={22} color="var(--accent)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 980, paddingTop: 48, paddingBottom: 60 }}>
        <div className="partner-form-card">
          <div className="partner-form-image">
            <img src="https://images.unsplash.com/photo-1560869713-7d0a29430803?w=900&q=85&fit=crop" alt="Beyomo professional at work" loading="eager" />
            <div className="partner-form-image-overlay">
              <div className="partner-form-image-quote">"Joining Beyomo doubled my monthly bookings within two months — and I get to set my own hours."</div>
              <div className="partner-form-image-author">— Priya S., Hair Stylist, Mumbai</div>
            </div>
          </div>

          <div className="partner-form-fields">
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Register Your Interest</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>Takes less than a minute. Our team will reach out to complete your onboarding.</p>

            <form onSubmit={submit}>
              <Field label="Full Name" required error={errors.name}>
                <input className="form-input" placeholder="e.g. Sonal Kapoor" value={form.name} onChange={(e) => f('name', e.target.value)} />
              </Field>
              <Field label="Phone Number" required error={errors.phone}>
                <input className="form-input" placeholder="10-digit mobile number" value={form.phone} onChange={(e) => f('phone', e.target.value.replace(/\D/g, ''))} maxLength={10} type="tel" />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input className="form-input" placeholder="partner@gmail.com" value={form.email} onChange={(e) => f('email', e.target.value)} type="email" />
              </Field>
              <Field label="City" required error={errors.cityId}>
                {loadingCities ? (
                  <div className="form-input" style={{ color: 'var(--muted)' }}>Loading cities…</div>
                ) : (
                  <select className="form-input" value={form.cityId} onChange={(e) => f('cityId', e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">Select your city</option>
                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}{c.state ? `, ${c.state}` : ''}</option>)}
                    <option value="other">Other (not listed)</option>
                  </select>
                )}
              </Field>
              {isOtherCity && (
                <Field label="Your City" required error={errors.otherCity}>
                  <input className="form-input" placeholder="Tell us your city" value={form.otherCity} onChange={(e) => f('otherCity', e.target.value)} />
                </Field>
              )}
              <Field label="Experience (years)">
                <input className="form-input" placeholder="e.g. 3" value={form.experience} onChange={(e) => f('experience', e.target.value)} type="number" min="0" />
              </Field>

              {apiError && (
                <div style={{ marginTop: 4, marginBottom: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, fontSize: 14, color: '#DC2626' }}>
                  {apiError}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', marginTop: 12, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting…' : "I'm Interested →"}
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 32, flexWrap: 'wrap' }}>
          {PERKS.map((p) => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              <p.icon size={16} color="var(--primary)" /> {p.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
