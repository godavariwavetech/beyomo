import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const INFO = [
  { icon: '📧', bg: '#DBEAFE', title: 'Email Support', detail: 'support@beyomo.com', sub: 'We reply within 4 hours' },
  { icon: '📞', bg: '#D1FAE5', title: 'Phone Support', detail: '+91 1800-XXX-XXXX', sub: 'Mon – Sun, 8 AM – 10 PM' },
  { icon: '📍', bg: '#FEF3C7', title: 'Head Office', detail: '12th Floor, One BKC, Mumbai 400051', sub: 'Maharashtra, India' },
  { icon: '💬', bg: '#EDE9FE', title: 'Live Chat', detail: 'Available in the App', sub: 'Avg. wait time: 2 mins' },
];

export default function Contact() {
  const pageRef = useRevealAll();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSent(true);
    } catch (err) {
      alert(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef}>
      {/* ── Hero ── */}
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Get in Touch</span>
          <h1 className="anim-fadeUp d-2">We'd Love to<br /><span style={{ color: 'var(--accent)' }}>Hear from You</span></h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 16 }}>Have a question, feedback, or partnership inquiry? Our team typically responds within a few hours.</p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <section className="section">
        <div className="container">
          <div className="contact-grid">
            {/* Form */}
            <div className="reveal-left">
              {sent ? (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '64px 44px', textAlign: 'center' }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
                  <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Message Sent!</h2>
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>Thank you for reaching out, <strong>{form.name}</strong>. Our team will get back to you at <strong>{form.email}</strong> within 4 hours.</p>
                  <button className="btn btn-primary" onClick={() => { setSent(false); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); }}>Send Another Message</button>
                </div>
              ) : (
                <div className="contact-form-card">
                  <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Send Us a Message</h2>
                  <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Fill in the form and we'll be in touch shortly.</p>
                  <form onSubmit={submit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }} className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Full Name *</label>
                        <input name="name" value={form.name} onChange={change} className="form-input" placeholder="Your full name" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Email *</label>
                        <input name="email" type="email" value={form.email} onChange={change} className="form-input" placeholder="you@email.com" required />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }} className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Phone</label>
                        <input name="phone" value={form.phone} onChange={change} className="form-input" placeholder="+91 98765 43210" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Subject *</label>
                        <select name="subject" value={form.subject} onChange={change} className="form-input" required>
                          <option value="">Select a topic</option>
                          <option>General Inquiry</option>
                          <option>Booking Support</option>
                          <option>Partner / Professional Inquiry</option>
                          <option>Refund or Cancellation</option>
                          <option>Press / Media</option>
                          <option>Business Partnership</option>
                          <option>Feedback</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Message *</label>
                      <textarea name="message" value={form.message} onChange={change} className="form-input" placeholder="Tell us how we can help..." required style={{ minHeight: 140, resize: 'vertical' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                      {loading ? '⏳ Sending...' : '✉️ Send Message'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="reveal-right">
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Contact Information</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28, lineHeight: 1.65 }}>Our support team is available 7 days a week to help with bookings, refunds, professional inquiries, and anything else.</p>

              {INFO.map(c => (
                <div key={c.title} className="contact-info-card">
                  <div className="contact-icon" style={{ background: c.bg }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.detail}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.sub}</div>
                  </div>
                </div>
              ))}

              <div style={{ background: 'linear-gradient(135deg,var(--dark),var(--teal))', borderRadius: 'var(--r-xl)', padding: '28px', marginTop: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>⚡ Quick Response</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, marginBottom: 16 }}>Our support team operates 7 days a week, 8 AM – 10 PM. Average first response is under 2 hours.</p>
                <Link to="/help" className="btn btn-accent btn-sm">View Help Center</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Map Placeholder ── */}
      <div style={{ background: 'linear-gradient(135deg,var(--light),#e2e8f0)', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(2,176,232,0.06) 0%, transparent 60%)' }} />
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📍</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Mumbai, Maharashtra</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>One BKC, Bandra Kurla Complex</div>
        </div>
      </div>

      <style>{`@media(max-width:600px){.form-row{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
