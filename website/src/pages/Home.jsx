import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

/* ── Data ── */
const SERVICES = [
  { title: 'Facial', meta: '⭐ 4.5 · 245 bookings', price: 'From ₹500', img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80' },
  { title: 'Hair Spa', meta: '⭐ 4.3 · 189 bookings', price: 'From ₹800', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' },
  { title: 'Makeup', meta: '⭐ 4.7 · 156 bookings', price: 'From ₹1,200', img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80' },
  { title: 'Waxing', meta: '⭐ 4.2 · 312 bookings', price: 'From ₹300', img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&q=80' },
  { title: 'Pedicure', meta: '⭐ 4.4 · 278 bookings', price: 'From ₹400', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80' },
  { title: 'Bridal Makeup', meta: '⭐ 4.9 · 42 bookings', price: 'From ₹5,000', img: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80' },
  { title: 'Massage', meta: '⭐ 4.6 · 134 bookings', price: 'From ₹900', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80' },
  { title: 'Haircut', meta: '⭐ 4.1 · 398 bookings', price: 'From ₹250', img: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80' },
];

const STEPS = [
  { n: 1, icon: '🔍', title: 'Browse & Choose', desc: 'Explore our full menu of beauty and wellness services. Filter by category, price, or ratings to find your perfect match.' },
  { n: 2, icon: '📅', title: 'Book Your Slot', desc: 'Pick a date and time that works for you. Our system instantly matches you with a verified professional nearby.' },
  { n: 3, icon: '🛋️', title: 'Relax at Home', desc: 'Your professional arrives fully equipped at your door. Sit back, enjoy, and pay securely via UPI or card.' },
];

const FEATURES = [
  { bg: '#D1FAE5', icon: '🛡️', title: 'Verified & Trained Professionals', desc: 'Every partner undergoes background verification, skill assessment, and hygiene training before being listed.' },
  { bg: '#DBEAFE', icon: '💳', title: 'Secure & Flexible Payments', desc: 'Pay via UPI, card, or Razorpay after the service is done. No advance payment required for most services.' },
  { bg: '#FEF3C7', icon: '⚡', title: 'On-Time Guarantee', desc: "We track every booking in real-time. If a professional is running late, you'll be notified instantly with a live ETA." },
  { bg: '#FEE2E2', icon: '💬', title: '24/7 Customer Support', desc: 'Our support team is always available to assist with bookings, reschedules, complaints, or any other query.' },
  { bg: '#EDE9FE', icon: '🧴', title: 'Premium Products Used', desc: 'Our professionals use only high-quality, dermatologist-approved products for all skin, hair, and wellness services.' },
  { bg: '#F0FDF4', icon: '⭐', title: 'Rating & Review System', desc: 'After every service, rate your experience. Reviews are verified and help maintain quality across all professionals.' },
];

const PROFESSIONALS = [
  { initials: 'SK', name: 'Sonal Kapoor', service: 'Facial & Skin Care · Mumbai', rating: '★★★★★  4.8 · 124 jobs', exp: '5 years exp.', grad: 'linear-gradient(135deg,#0E5843,#064081)' },
  { initials: 'HK', name: 'Harleen Kaur', service: 'Bridal Makeup · Delhi', rating: '★★★★★  5.0 · 34 jobs', exp: '9 years exp.', grad: 'linear-gradient(135deg,#9333ea,#6366f1)' },
  { initials: 'PR', name: 'Preethi Raj', service: 'Massage & Wellness · Chennai', rating: '★★★★★  4.7 · 89 jobs', exp: '6 years exp.', grad: 'linear-gradient(135deg,#0891b2,#0284c7)' },
  { initials: 'BN', name: 'Bhavna Nair', service: 'Skin Care · Kochi', rating: '★★★★★  4.8 · 102 jobs', exp: '8 years exp.', grad: 'linear-gradient(135deg,#d97706,#f59e0b)' },
];

const TESTIMONIALS = [
  { stars: '★★★★★', text: '"Amazing facial! My skin feels so rejuvenated. Sonal was on time, very professional, and used excellent products. Will definitely book again!"', name: 'Meera Gupta', loc: 'Mumbai · Facial', initials: 'MG' },
  { stars: '★★★★★', text: '"Harleen transformed my bridal look completely! Every guest complimented my makeup. She is truly an artist. BEST EVER. So happy I found Beyomo!"', name: 'Lakshmi Das', loc: 'Delhi · Bridal Makeup', initials: 'LD' },
  { stars: '★★★★★', text: '"Preethi is incredible! The massage session was therapeutic. She knows exactly how to relieve stress. Already booked next month. Highly recommend!"', name: 'Priya Sharma', loc: 'Mumbai · Massage', initials: 'PS' },
  { stars: '★★★★★', text: '"Bhavna is absolutely professional. My skin has never looked better. Very satisfied with the service and the products used. Amazing experience!"', name: 'Nandita Roy', loc: 'Kochi · Skin Care', initials: 'NR' },
  { stars: '★★★★★', text: '"The booking process is so smooth and the service was delivered exactly on time. The hair spa left my hair incredibly soft. Beyomo is now my go-to app!"', name: 'Rekha Malhotra', loc: 'Chennai · Hair Spa', initials: 'RM' },
  { stars: '★★★★★', text: '"Absolutely magical transformation! I looked stunning at the party. The makeup lasted all night and multiple people asked for the professional\'s contact!"', name: 'Pooja Mehta', loc: 'Noida · Bridal Makeup', initials: 'PM' },
];

const CITIES = ['🏙️ Mumbai','🏙️ Delhi','🏙️ Bangalore','🏙️ Hyderabad','🏙️ Chennai','🏙️ Pune','🏙️ Kochi','🏙️ Lucknow'];
const CITIES_SOON = ['🏙️ Jaipur — Coming Soon','🏙️ Ahmedabad — Coming Soon'];

/* ── Counter animation ── */
function useCounter(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime;
    const num = parseInt(String(target).replace(/[^0-9]/g, ''));
    const step = ts => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * num));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatItem({ value, label }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const num = parseInt(String(value).replace(/[^0-9]/g, ''));
  const suffix = String(value).replace(/[0-9,]/g, '');
  const count = useCounter(num, 1600, started);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-val">{started ? count.toLocaleString('en-IN') + suffix : '0' + suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ── Floating blob ── */
function Blob({ style }) {
  return <div className="anim-blob" style={{ position: 'absolute', borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', ...style }} />;
}

export default function Home() {
  const s1 = useRevealAll();
  const s2 = useRevealAll();
  const s3 = useRevealAll();
  const s4 = useRevealAll();
  const s5 = useRevealAll();

  return (
    <div>
      {/* ══ HERO ══ */}
      <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--dark) 0%, var(--teal) 42%, #0d7a5e 72%, var(--dark) 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 70 }}>
        {/* Animated blobs */}
        <Blob style={{ top: '-15%', left: '-8%', width: 580, height: 580, background: 'radial-gradient(circle, rgba(253,215,122,0.1) 0%, transparent 70%)', animationDuration: '10s' }} />
        <Blob style={{ bottom: '-12%', right: '-8%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(2,176,232,0.1) 0%, transparent 70%)', animationDuration: '8s', animationDelay: '2s' }} />
        <Blob style={{ top: '30%', right: '5%', width: 240, height: 240, background: 'radial-gradient(circle, rgba(253,215,122,0.06) 0%, transparent 70%)', animationDuration: '6s', animationDelay: '1s' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center', padding: '80px 0' }} className="hero-grid">
            {/* Text */}
            <div>
              <div className="anim-fadeDown d-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: 'var(--accent)', padding: '7px 18px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700, marginBottom: 24, border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }} className="anim-dot" />
                Now Available in 8+ Cities
              </div>
              <h1 className="anim-fadeUp d-2" style={{ fontSize: 'clamp(36px,5.5vw,64px)', fontWeight: 800, color: 'white', lineHeight: 1.08, marginBottom: 22 }}>
                Beauty &amp; Wellness<br /><span style={{ color: 'var(--accent)' }}>at Your Doorstep</span>
              </h1>
              <p className="anim-fadeUp d-3" style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.68, marginBottom: 38, maxWidth: 480 }}>
                Book certified beauty and wellness professionals who come to you. Facial, massage, bridal makeup, hair care and more — done at home, at your convenience.
              </p>
              <div className="anim-fadeUp d-4" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <a href="#download" className="btn btn-accent">📱 Download the App</a>
                <a href="#services" className="btn btn-outline-white">Explore Services ↓</a>
              </div>
              <div className="anim-fadeUp d-6" style={{ display: 'flex', gap: 36, marginTop: 52, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
                {[['2.8K+','Happy Customers'],['186','Verified Pros'],['4.4★','Avg. Rating']].map(([v,l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{v}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* App mockup */}
            <div className="anim-fadeLeft d-4 hero-visual" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="anim-float" style={{ background: 'white', borderRadius: 36, padding: 24, boxShadow: '0 48px 100px rgba(0,0,0,0.38)', maxWidth: 300, width: '100%', position: 'relative' }}>
                {/* Glow */}
                <div style={{ position: 'absolute', inset: -2, borderRadius: 38, background: 'linear-gradient(135deg, rgba(253,215,122,0.3), rgba(2,176,232,0.2))', filter: 'blur(12px)', zIndex: -1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,var(--teal),var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>B</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Beyomo</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Beauty at Home</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
                    Live
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Popular Services</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[['Facial','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=150&q=80'],['Makeup','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=150&q=80'],['Massage','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150&q=80'],['Hair Spa','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&q=80']].map(([name, img]) => (
                    <div key={name} style={{ background: 'var(--light)', borderRadius: 12, padding: 10, textAlign: 'center', transition: 'transform 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseOut={e => e.currentTarget.style.transform = ''}
                    >
                      <img src={img} alt={name} style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{name}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--primary))', color: 'white', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Booking Confirmed!</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Sonal arrives at 10:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section className="section" id="services" ref={s1}>
        <div className="container">
          <span className="badge reveal">Our Services</span>
          <h2 className="section-title reveal">Everything Beauty,<br />Brought to You</h2>
          <p className="section-sub reveal">From quick threading to full bridal transformations — we have a certified professional for every beauty need.</p>
          <div className="services-grid reveal-stagger">
            {SERVICES.map(s => (
              <div key={s.title} className="service-card reveal">
                <img src={s.img} alt={s.title} loading="lazy" />
                <div className="service-card-body">
                  <div className="service-card-title">{s.title}</div>
                  <div className="service-card-meta">{s.meta}</div>
                  <div className="service-card-price">{s.price}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#download" className="btn btn-primary">See All 12+ Services →</a>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="section section-alt" id="how-it-works" ref={s2}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="badge reveal">Simple &amp; Fast</span>
            <h2 className="section-title reveal">Book in 3 Easy Steps</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>Getting a professional home service has never been easier. No calls, no hassle — just tap, book, and relax.</p>
          </div>
          <div className="steps-grid reveal-stagger">
            {STEPS.map((s, i) => (
              <div key={s.n} className="step-card reveal">
                <div className="step-number">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <p className="step-desc">{s.desc}</p>
                {i < STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS BANNER ══ */}
      <div className="stats-banner">
        <div className="container">
          <div className="stats-banner-grid">
            {[['2,847+','Happy Customers'],['186','Verified Professionals'],['3,842+','Services Completed'],['4.4 ★','Average Rating']].map(([v,l]) => (
              <StatItem key={l} value={v} label={l} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ WHY BEYOMO ══ */}
      <section className="section" ref={s3}>
        <div className="container">
          <span className="badge reveal">Why Choose Us</span>
          <h2 className="section-title reveal">The Beyomo Difference</h2>
          <p className="section-sub reveal">Every detail of our platform is designed around your safety, comfort, and satisfaction.</p>
          <div className="features-grid reveal-stagger" style={{ marginTop: 52 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card reveal">
                <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PROFESSIONALS ══ */}
      <section className="section section-alt" ref={s4}>
        <div className="container">
          <span className="badge reveal">Top Rated</span>
          <h2 className="section-title reveal">Meet Our Star Professionals</h2>
          <p className="section-sub reveal">Handpicked based on ratings, experience, and customer satisfaction scores.</p>
          <div className="partners-grid reveal-stagger">
            {PROFESSIONALS.map(p => (
              <div key={p.name} className="partner-card reveal">
                <div className="partner-avatar" style={{ background: p.grad }}>{p.initials}</div>
                <div className="partner-name">{p.name}</div>
                <div className="partner-service">{p.service}</div>
                <div className="partner-rating">{p.rating}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, background: 'var(--light)', padding: '4px 10px', borderRadius: 99, display: 'inline-block' }}>{p.exp}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#download" className="btn btn-secondary">Download the App →</a>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="section" id="testimonials" ref={s5}>
        <div className="container">
          <span className="badge reveal">Customer Love</span>
          <h2 className="section-title reveal">What Our Customers Say</h2>
          <p className="section-sub reveal">Real reviews from real customers. No fake ratings — ever.</p>
          <div className="testimonials-grid reveal-stagger">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card reveal">
                <div className="testimonial-stars">{t.stars}</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CITIES ══ */}
      <section className="section section-alt" id="cities">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="badge reveal">Service Areas</span>
          <h2 className="section-title reveal">Now Available in Your City</h2>
          <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>We're expanding fast. Beyomo is currently live in these cities with more launching soon.</p>
          <div className="cities-grid reveal">
            {CITIES.map(c => <div key={c} className="city-pill">{c}</div>)}
            {CITIES_SOON.map(c => <div key={c} className="city-pill coming-soon">{c}</div>)}
          </div>
        </div>
      </section>

      {/* ══ DOWNLOAD APP ══ */}
      <section className="app-section" id="download">
        <div className="container">
          <div className="app-inner">
            <div className="anim-fadeRight">
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', padding: '5px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 18, border: '1px solid rgba(255,255,255,0.2)' }}>Available on iOS &amp; Android</div>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white', marginBottom: 16, lineHeight: 1.15 }}>Download the<br />Beyomo App Today</h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', lineHeight: 1.68, marginBottom: 34, maxWidth: 440 }}>
                Get your first booking at 20% off with code <strong style={{ color: 'var(--accent)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 6 }}>WELCOME20</strong>. Book beauty and wellness pros on the go, track their arrival live, and pay in one tap.
              </p>
              <div className="app-badges">
                <a href="#" className="app-badge">
                  <div className="app-badge-icon">🍎</div>
                  <div className="app-badge-text"><small>Download on the</small><strong>App Store</strong></div>
                </a>
                <a href="#" className="app-badge">
                  <div className="app-badge-icon">▶️</div>
                  <div className="app-badge-text"><small>Get it on</small><strong>Google Play</strong></div>
                </a>
              </div>
              <div style={{ marginTop: 28, fontSize: 14, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#F59E0B' }}>★★★★★</span> 4.8 rating · 10,000+ downloads
              </div>
            </div>

            {/* Phone mockups */}
            <div className="app-screens" style={{ display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'flex-start' }}>
              <div className="anim-float" style={{ background: 'white', borderRadius: 28, width: 200, padding: 16, boxShadow: '0 32px 72px rgba(0,0,0,0.28)' }}>
                <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--primary))', borderRadius: 14, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ color: 'white', textAlign: 'center' }}><div style={{ fontSize: 26 }}>💆</div><div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>Book Beauty</div></div>
                </div>
                {[80,48,52,48].map((h,i) => <div key={i} style={{ height: h, background: i===3?'linear-gradient(135deg,var(--teal),var(--primary))':'var(--light)', borderRadius: 10, marginBottom: 10 }} />)}
              </div>
              <div className="anim-float-slow" style={{ background: 'white', borderRadius: 28, width: 200, padding: 16, boxShadow: '0 32px 72px rgba(0,0,0,0.28)', marginTop: 40 }}>
                <div style={{ background: '#FEF3C7', borderRadius: 14, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}><div style={{ fontSize: 26 }}>✅</div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dark)', marginTop: 4 }}>Booking Confirmed</div></div>
                </div>
                {[52,72,48,52].map((h,i) => <div key={i} style={{ height: h, background: i===3?'linear-gradient(135deg,var(--teal),var(--primary))':'var(--light)', borderRadius: 10, marginBottom: 10 }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>


      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center; gap: 40px !important; padding: 60px 0 !important; }
          .hero-visual { display: none !important; }
          .app-screens { display: none !important; }
          .app-inner { grid-template-columns: 1fr !important; text-align: center; }
          .app-badges { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
