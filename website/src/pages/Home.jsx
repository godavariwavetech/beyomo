import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

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
  { n: 3, icon: '🛋️', title: 'Relax at Home', desc: 'Your professional arrives at your door fully equipped. Sit back, enjoy the service, and pay securely via UPI or card.' },
];

const FEATURES = [
  { bg: '#D1FAE5', icon: '🛡️', title: 'Verified & Trained Professionals', desc: 'Every partner undergoes background verification, skill assessment, and hygiene training before getting listed on Beyomo.' },
  { bg: '#DBEAFE', icon: '💳', title: 'Secure & Flexible Payments', desc: 'Pay via UPI, card, or Razorpay after the service is done. No advance payment required for most services.' },
  { bg: '#FEF3C7', icon: '⚡', title: 'On-Time Guarantee', desc: "We track every booking in real-time. If a professional is running late, you'll be notified instantly with a live ETA." },
  { bg: '#FEE2E2', icon: '💬', title: '24/7 Customer Support', desc: 'Our support team is always available to assist with bookings, reschedules, complaints, or any other query.' },
  { bg: '#EDE9FE', icon: '🧴', title: 'Premium Products Used', desc: 'Our professionals use only high-quality, dermatologist-approved products for all skin, hair, and wellness services.' },
  { bg: '#F0FDF4', icon: '⭐', title: 'Rating & Review System', desc: 'After every service, rate your experience. Reviews are verified and help maintain quality across all professionals.' },
];

const PROFESSIONALS = [
  { initials: 'SK', name: 'Sonal Kapoor', service: 'Facial & Skin Care · Mumbai', rating: '★★★★★ 4.8 · 124 jobs', exp: '5 years experience', grad: 'linear-gradient(135deg,#0E5843,#064081)' },
  { initials: 'HK', name: 'Harleen Kaur', service: 'Bridal Makeup · Delhi', rating: '★★★★★ 5.0 · 34 jobs', exp: '9 years experience', grad: 'linear-gradient(135deg,#9333ea,#6366f1)' },
  { initials: 'PR', name: 'Preethi Raj', service: 'Massage & Wellness · Chennai', rating: '★★★★★ 4.7 · 89 jobs', exp: '6 years experience', grad: 'linear-gradient(135deg,#0891b2,#0284c7)' },
  { initials: 'BN', name: 'Bhavna Nair', service: 'Massage & Skin Care · Kochi', rating: '★★★★★ 4.8 · 102 jobs', exp: '8 years experience', grad: 'linear-gradient(135deg,#d97706,#f59e0b)' },
];

const TESTIMONIALS = [
  { stars: '★★★★★', text: '"Amazing facial! My skin feels so rejuvenated. Sonal was on time, very professional, and used excellent products. Will definitely book again!"', name: 'Meera Gupta', loc: 'Mumbai · Facial', initials: 'MG' },
  { stars: '★★★★★', text: '"Harleen transformed my bridal look completely! Every guest complimented my makeup. She is truly an artist. BEST EVER. So happy I found Beyomo!"', name: 'Lakshmi Das', loc: 'Delhi · Bridal Makeup', initials: 'LD' },
  { stars: '★★★★★', text: '"Preethi is incredible! The massage session was therapeutic and she knows exactly how to relieve stress. Already booked next month. Highly recommend!"', name: 'Priya Sharma', loc: 'Mumbai · Massage', initials: 'PS' },
  { stars: '★★★★★', text: '"Bhavna is absolutely professional. My skin has never looked better. Very satisfied with the service and the products used."', name: 'Nandita Roy', loc: 'Kochi · Skin Care', initials: 'NR' },
  { stars: '★★★★★', text: '"The booking process is so smooth and the service was delivered exactly on time. The hair spa left my hair incredibly soft. Beyomo is now my go-to app!"', name: 'Rekha Malhotra', loc: 'Chennai · Hair Spa', initials: 'RM' },
  { stars: '★★★★★', text: '"Absolutely magical transformation! I looked stunning at the party. The makeup lasted all night and multiple people asked for the contact. Worth every rupee!"', name: 'Pooja Mehta', loc: 'Noida · Bridal Makeup', initials: 'PM' },
];

const CITIES = ['🌆 Mumbai','🌆 Delhi','🌆 Bangalore','🌆 Hyderabad','🌆 Chennai','🌆 Pune','🌆 Kochi','🌆 Lucknow'];
const CITIES_SOON = ['🌆 Jaipur — Coming Soon','🌆 Ahmedabad — Coming Soon'];

function ServiceCard({ s }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="service-card reveal">
      <img src={s.img} alt={s.title} loading="lazy" />
      <div className="service-card-body">
        <div className="service-card-title">{s.title}</div>
        <div className="service-card-meta">{s.meta}</div>
        <div className="service-card-price">{s.price}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--dark) 0%, var(--teal) 40%, #0d7a5e 70%, var(--dark) 100%)',
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', paddingTop: 68,
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(253,215,122,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(2,176,232,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', padding: '80px 0' }} className="hero-grid">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', padding: '6px 16px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 600, marginBottom: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
                <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                Now Available in 8+ Cities
              </div>
              <h1 style={{ fontSize: 'clamp(36px,5vw,58px)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: 20 }}>
                Beauty &amp; Wellness<br /><span style={{ color: 'var(--accent)' }}>at Your Doorstep</span>
              </h1>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: 36 }}>
                Book certified beauty and wellness professionals who come to you. Facial, massage, bridal makeup, hair care and more — done at home, at your convenience.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <a href="#download" className="btn btn-accent">📱 Download the App</a>
                <a href="#services" className="btn btn-outline-white">Explore Services</a>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                {[['2.8K+','Happy Customers'],['186','Verified Pros'],['4.4★','Avg. Rating']].map(([v,l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{v}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }} className="hero-visual-hide">
              <div style={{ background: 'white', borderRadius: 36, padding: 24, boxShadow: '0 40px 80px rgba(0,0,0,0.35)', maxWidth: 300, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,var(--teal),var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>B</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Beyomo</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Beauty at Home</div>
                  </div>
                  <div style={{ marginLeft: 'auto', background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>Live</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>Popular Services</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Facial','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=150&q=80'],['Makeup','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=150&q=80'],['Massage','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150&q=80'],['Hair Spa','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&q=80']].map(([name, img]) => (
                    <div key={name} style={{ background: 'var(--light)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                      <img src={img} alt={name} style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--primary))', color: 'white', borderRadius: 12, padding: '12px 16px', marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Booking Confirmed!</div>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>Sonal arrives at 10:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @media (max-width:768px) { .hero-grid { grid-template-columns:1fr !important; text-align:center; } .hero-visual-hide { display:none !important; } }
        `}</style>
      </section>

      {/* ── Services ── */}
      <section className="section" id="services">
        <div className="container">
          <span className="badge">Our Services</span>
          <h2 className="section-title">Everything Beauty,<br />Brought to You</h2>
          <p className="section-sub">From quick threading to full bridal transformations — we have a certified professional for every beauty need.</p>
          <div className="services-grid">
            {SERVICES.map(s => <ServiceCard key={s.title} s={s} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <a href="#download" className="btn btn-primary">See All 12+ Services →</a>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section section-alt" id="how-it-works">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="badge">Simple &amp; Fast</span>
            <h2 className="section-title">Book in 3 Easy Steps</h2>
            <p className="section-sub" style={{ margin: '12px auto 0' }}>Getting a professional home service has never been easier. No calls, no hassle — just tap, book, and relax.</p>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={s.n} className="step-card reveal" ref={useReveal()}>
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

      {/* ── Stats Banner ── */}
      <div className="stats-banner">
        <div className="container">
          <div className="stats-banner-grid">
            {[['2,847+','Happy Customers'],['186','Verified Professionals'],['3,842+','Services Completed'],['4.4 ★','Average Rating']].map(([v,l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div className="stat-val">{v}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why Beyomo ── */}
      <section className="section">
        <div className="container">
          <span className="badge">Why Choose Us</span>
          <h2 className="section-title">The Beyomo Difference</h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card reveal" ref={useReveal()}>
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

      {/* ── Professionals ── */}
      <section className="section section-alt">
        <div className="container">
          <span className="badge">Top Rated Professionals</span>
          <h2 className="section-title">Meet Our Star Professionals</h2>
          <p className="section-sub">Handpicked based on ratings, experience, and customer satisfaction.</p>
          <div className="partners-grid">
            {PROFESSIONALS.map(p => (
              <div key={p.name} className="partner-card reveal" ref={useReveal()}>
                <div className="partner-avatar" style={{ background: p.grad }}>{p.initials}</div>
                <div className="partner-name">{p.name}</div>
                <div className="partner-service">{p.service}</div>
                <div className="partner-rating">{p.rating}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{p.exp}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/join" className="btn btn-secondary">Join as a Professional →</Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section" id="testimonials">
        <div className="container">
          <span className="badge">Customer Love</span>
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card reveal" ref={useReveal()}>
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

      {/* ── Cities ── */}
      <section className="section section-alt" id="cities">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="badge">Service Areas</span>
          <h2 className="section-title">Now Available in Your City</h2>
          <p className="section-sub" style={{ margin: '12px auto 0' }}>We're expanding fast! Beyomo is currently live in these cities with more launching soon.</p>
          <div className="cities-grid">
            {CITIES.map(c => <div key={c} className="city-pill">{c}</div>)}
            {CITIES_SOON.map(c => <div key={c} className="city-pill coming-soon">{c}</div>)}
          </div>
        </div>
      </section>

      {/* ── Download App ── */}
      <section className="app-section" id="download">
        <div className="container">
          <div className="app-inner">
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', padding: '4px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 16, border: '1px solid rgba(255,255,255,0.2)' }}>Available on iOS &amp; Android</div>
              <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 800, color: 'white', marginBottom: 16 }}>Download the<br />Beyomo App Today</h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, marginBottom: 32 }}>
                Get your first booking at 20% off with code <strong style={{ color: 'var(--accent)' }}>WELCOME20</strong>. Book beauty and wellness pros on the go, track their arrival live, and pay in one tap.
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
              <div style={{ marginTop: 28, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>⭐⭐⭐⭐⭐ &nbsp;4.8 rating · 10,000+ downloads</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }} className="app-screens-hide">
              {[
                { bg: 'linear-gradient(135deg,var(--teal),var(--primary))', icon: '💆', label: 'Book Beauty', cardBg: '#FEF3C7', cardIcon: '✅', cardLabel: 'Booking Confirmed' },
              ].map(() => (
                <React.Fragment key="screens">
                  <div style={{ background: 'white', borderRadius: 28, width: 200, padding: 16, boxShadow: '0 30px 60px rgba(0,0,0,0.25)' }}>
                    <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--primary))', borderRadius: 14, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <div style={{ color: 'white', textAlign: 'center' }}><div style={{ fontSize: 22 }}>💆</div><div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>Book Beauty</div></div>
                    </div>
                    {[80,48,48,52].map((h,i) => <div key={i} style={{ height: h, background: i===3?'linear-gradient(135deg,var(--teal),var(--primary))':'var(--light)', borderRadius: 10, marginBottom: 8 }} />)}
                  </div>
                  <div style={{ background: 'white', borderRadius: 28, width: 200, padding: 16, boxShadow: '0 30px 60px rgba(0,0,0,0.25)', marginTop: 32 }}>
                    <div style={{ background: '#FEF3C7', borderRadius: 14, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <div style={{ color: 'var(--dark)', textAlign: 'center' }}><div style={{ fontSize: 22 }}>✅</div><div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>Booking Confirmed</div></div>
                    </div>
                    {[48,64,48,52].map((h,i) => <div key={i} style={{ height: h, background: i===3?'linear-gradient(135deg,var(--teal),var(--primary))':'var(--light)', borderRadius: 10, marginBottom: 8 }} />)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <style>{`@media(max-width:768px){.app-screens-hide{display:none!important}}`}</style>
        </div>
      </section>

      {/* ── Join as Partner Banner ── */}
      <section className="section" style={{ background: 'var(--light)' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(135deg,var(--dark),var(--teal))', borderRadius: 'var(--r-xl)', padding: '48px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>For Professionals</div>
              <h3 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'white', marginBottom: 10 }}>Grow Your Business with Beyomo</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', maxWidth: 500, lineHeight: 1.65 }}>Join 186+ certified professionals earning ₹20,000–₹55,000/month. Set your own schedule, build your client base, and get paid on time — every time.</p>
            </div>
            <Link to="/join" className="btn btn-accent" style={{ flexShrink: 0, fontSize: 15 }}>Apply to Join →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
