import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const CATS = [
  { icon: '📱', title: 'App & Account', count: 8 },
  { icon: '📅', title: 'Bookings', count: 12 },
  { icon: '💳', title: 'Payments & Pricing', count: 7 },
  { icon: '🔄', title: 'Cancellations & Refunds', count: 6 },
  { icon: '👩‍💼', title: 'Our Professionals', count: 5 },
  { icon: '🔒', title: 'Safety & Privacy', count: 4 },
];

const FAQS = [
  {
    category: 'Bookings',
    items: [
      { q: 'How do I make a booking on Beyomo?', a: 'Open the Beyomo app, browse services or search for what you need, select your preferred date and time, choose a professional, and confirm. You\'ll receive an instant confirmation via SMS and email with your professional\'s details.' },
      { q: 'Can I request a specific professional?', a: 'Yes! If you\'ve had a great experience with a particular professional, you can find them in "My Favourites" or search by name in the app. Repeat bookings with the same professional are encouraged.' },
      { q: 'How far in advance can I book?', a: 'You can book services up to 30 days in advance. Same-day bookings are available for most services, subject to professional availability in your area.' },
      { q: 'What if my professional is late?', a: 'We have an on-time guarantee. If your professional is running more than 15 minutes late, you\'ll receive a real-time notification with an updated ETA. If they arrive more than 30 minutes late without prior notice, you\'re entitled to a 10% discount on the service.' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods are accepted?', a: 'We accept UPI (Google Pay, PhonePe, Paytm), credit cards, debit cards, net banking, and digital wallets — all securely processed by Razorpay. Cash payments are not accepted.' },
      { q: 'When do I need to pay?', a: 'For most services, you pay after the service is completed. Some premium or bridal packages require a partial advance payment at the time of booking. The payment requirement is clearly shown before you confirm.' },
      { q: 'Is my payment secure?', a: 'Absolutely. All payments are processed by Razorpay, a PCI-DSS Level 1 certified payment gateway. We never store your card details on our servers.' },
      { q: 'What is the platform fee?', a: 'A small convenience fee (typically ₹15–₹30) may apply to bookings. This is shown transparently at checkout before you confirm your booking.' },
    ],
  },
  {
    category: 'Cancellations & Refunds',
    items: [
      { q: 'Can I cancel my booking for free?', a: 'Yes — cancellations made more than 2 hours before the scheduled appointment are completely free and receive a full refund. Cancellations within 2 hours incur a partial fee. See our Cancellation Policy for full details.' },
      { q: 'How long do refunds take?', a: 'Once approved, refunds are initiated within 1 business day. UPI refunds arrive in 1–2 days. Card refunds take 5–7 business days depending on your bank. Razorpay wallet refunds are instant.' },
      { q: 'What if I\'m not happy with the service?', a: 'We take quality seriously. Report any issues within 24 hours of service completion via "My Bookings → Report Issue" in the app. Our team will review and offer a refund, re-service, or discount as appropriate.' },
    ],
  },
  {
    category: 'Account & Safety',
    items: [
      { q: 'How do I reset my password or change my phone number?', a: 'Go to Profile → Account Settings in the app. To change your phone number, you\'ll need to verify the new number via OTP. For any access issues, contact support@beyomo.com.' },
      { q: 'Is it safe to let a Beyomo professional into my home?', a: 'Safety is our top priority. Every professional undergoes identity verification (Aadhaar), background checks, in-person skill assessment, and hygiene training before being listed. You can also see verified ratings and reviews for each professional before booking.' },
      { q: 'Are the products used safe for my skin?', a: 'Yes. Our professionals are trained to use only high-quality, dermatologist-approved products. If you have specific allergies or sensitivities, mention them in the booking notes — our professionals will accommodate accordingly.' },
    ],
  },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div>
      {items.map((faq, i) => (
        <div key={i} className={`faq-item${open === i ? ' open' : ''}`} onClick={() => setOpen(open === i ? null : i)}>
          <div className="faq-question">
            <span>{faq.q}</span>
            <span className="faq-chevron">▼</span>
          </div>
          <div className="faq-answer">
            <div className="faq-answer-inner">{faq.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HelpCenter() {
  const pageRef = useRevealAll();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const filtered = search.trim()
    ? FAQS.map(g => ({ ...g, items: g.items.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.items.length > 0)
    : FAQS;

  return (
    <div ref={pageRef}>
      {/* ── Hero ── */}
      <div className="page-hero" style={{ paddingBottom: 96 }}>
        <div className="container page-hero-inner" style={{ textAlign: 'center' }}>
          <span className="badge anim-fadeUp d-1">Support</span>
          <h1 className="anim-fadeUp d-2">Help Center</h1>
          <p className="anim-fadeUp d-3" style={{ margin: '14px auto 36px', maxWidth: 500 }}>Find answers to common questions about bookings, payments, cancellations, and more.</p>
          <div style={{ display: 'flex', justifyContent: 'center' }} className="anim-fadeUp d-4">
            <div style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
              <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
              <input
                type="text"
                className="help-search"
                placeholder="Search for answers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 52 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Categories ── */}
      <section style={{ padding: '72px 0', background: 'var(--light)' }}>
        <div className="container">
          {!search && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h2 className="section-title reveal">Browse by Category</h2>
                <p className="section-sub reveal" style={{ margin: '12px auto 0' }}>Pick a topic to find relevant articles and guides.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="reveal-stagger help-cats-grid">
                {CATS.map((c, i) => (
                  <div key={c.title} className="help-cat-card reveal" onClick={() => setActiveTab(Math.min(i, FAQS.length - 1))}>
                    <div className="help-cat-icon">{c.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)' }}>{c.count} articles</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section">
        <div className="container">
          {search ? (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                  {filtered.reduce((n, g) => n + g.items.length, 0)} results for "{search}"
                </h2>
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>🤔</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>No results found</h3>
                  <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Try different keywords or contact our support team.</p>
                  <Link to="/contact" className="btn btn-primary btn-sm">Contact Support</Link>
                </div>
              ) : (
                filtered.map(group => (
                  <div key={group.category} style={{ marginBottom: 36 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>{group.category}</h3>
                    <FAQ items={group.items} />
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48 }} className="help-faq-grid">
              {/* Tabs */}
              <div>
                <div style={{ position: 'sticky', top: 96 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', marginBottom: 12 }}>Topics</div>
                  {FAQS.map((g, i) => (
                    <button key={g.category} onClick={() => setActiveTab(i)} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 'var(--r-sm)',
                      fontSize: 14, fontWeight: activeTab === i ? 700 : 500,
                      color: activeTab === i ? 'var(--primary)' : 'var(--text)',
                      background: activeTab === i ? 'rgba(6,64,129,0.07)' : 'transparent',
                      border: 'none', cursor: 'pointer', transition: 'all 0.18s', marginBottom: 4,
                      borderLeft: activeTab === i ? '3px solid var(--primary)' : '3px solid transparent',
                    }}>
                      {g.category}
                    </button>
                  ))}
                  <div style={{ marginTop: 28, padding: '20px', background: 'var(--light)', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Still stuck?</div>
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>Our team replies in under 2 hours.</p>
                    <Link to="/contact" className="btn btn-primary btn-sm" style={{ fontSize: 12, padding: '8px 16px' }}>Contact Us</Link>
                  </div>
                </div>
              </div>
              {/* Active FAQ */}
              <div className="reveal">
                <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28 }}>{FAQS[activeTab].category}</h2>
                <FAQ items={FAQS[activeTab].items} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section style={{ background: 'var(--light)', padding: '72px 0' }}>
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🙋</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Can't find what you need?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.65, marginBottom: 28 }}>Our support team is available 7 days a week, 8 AM to 10 PM. Average response time is under 2 hours.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-primary">📧 Email Us</Link>
              <a href="tel:+911800XXXXXXX" className="btn btn-secondary">📞 Call Us</a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media(max-width:768px){
          .help-cats-grid{grid-template-columns:repeat(2,1fr)!important}
          .help-faq-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){.help-cats-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}
