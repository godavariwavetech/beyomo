import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck, ShieldCheck, CreditCard, Zap, MessageCircle, SprayCan,
  Star, Smartphone, Building2, Briefcase, MapPin, Check, Lock, Handshake, Sparkles, CheckCircle2,
  Waves, Sun, ArrowRight, Home as HomeIcon, Package,
} from 'lucide-react';
import { useRevealAll } from '../hooks/useReveal';
import { useCity } from '../context/CityContext';
import CitySelectorModal from '../components/CitySelectorModal';
import { getBanners } from '../api/banners';
import { getCategories } from '../api/services';

function StarRow({ count = 5, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, verticalAlign: 'middle' }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={size} fill="#F59E0B" color="#F59E0B" />
      ))}
    </span>
  );
}

// Banners can carry admin-set gradientStart/gradientEnd (used elsewhere, e.g. the app),
// but the website always renders its own on-brand gradient so promos never clash with the theme.
const BRAND_GRADIENTS = [
  'linear-gradient(135deg, #062c20 0%, #105641 55%, #02b0e8 100%)',
  'linear-gradient(135deg, #0b3c2e 0%, #1c7a5c 60%, #02b0e8 100%)',
  'linear-gradient(135deg, #105641 0%, #02b0e8 100%)',
];
function bannerGradient(index) {
  return BRAND_GRADIENTS[index % BRAND_GRADIENTS.length];
}

/* ── Data ── */
// Fallback tiles shown only until the real categories load from the API (or on fetch
// failure) — kept in sync with the 16 live rate-card categories and their display order.
const SERVICES = [
  { title: 'Men Grooming', img: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=800&q=90&fit=crop' },
  { title: 'Haircut', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=90&fit=crop' },
  { title: 'Hair Spa', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=90&fit=crop' },
  { title: 'Hair Colour', img: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=90&fit=crop' },
  { title: 'Head Massage', img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=90&fit=crop' },
  { title: 'Hair Treatments', img: 'https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?w=800&q=90&fit=crop' },
  { title: 'Threading', img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=90&fit=crop' },
  { title: 'Waxing', img: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=90&fit=crop' },
  { title: 'De-Tan', img: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=90&fit=crop' },
  { title: 'Facials', img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=90&fit=crop' },
  { title: 'Peeloff Mask', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=90&fit=crop' },
  { title: 'Pedicure', img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=90&fit=crop' },
  { title: 'Manicure', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=90&fit=crop' },
  { title: 'Mehndi', img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&q=90&fit=crop' },
  { title: 'Nail Art', img: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&q=90&fit=crop' },
  { title: 'Bridal Services', img: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=90&fit=crop' },
];

const WHY_BEYOMO = ['Best brands in 1-time use packs', 'Trained, verified professionals', 'Mess-free service at your doorstep'];
const THREE_STEPS = ['Pick Your Service', 'Book Instantly', 'Salon at Your Doorstep'];

const BRANDS = ['SEYON', 'RICA', 'ÉLAN', "L'ORÉAL", 'O3+', 'SHAHNAZ HUSAIN', 'SEA SOUL', 'WELLA', 'LAKMÉ'];

const FEATURES = [
  { bg: '#D1FAE5', color: '#059669', icon: ShieldCheck, title: 'Verified & Trained Professionals', desc: 'Every partner undergoes background verification, skill assessment, and hygiene training before being listed.' },
  { bg: '#DBEAFE', color: '#2563EB', icon: CreditCard, title: 'Secure & Flexible Payments', desc: 'Pay via UPI, card, or Razorpay after the service is done. No advance payment required for most services.' },
  { bg: '#FEF3C7', color: '#D97706', icon: Zap, title: 'On-Time Guarantee', desc: "We track every booking in real-time. If a professional is running late, you'll be notified instantly with a live ETA." },
  { bg: '#FEE2E2', color: '#DC2626', icon: MessageCircle, title: '24/7 Customer Support', desc: 'Our support team is always available to assist with bookings, reschedules, complaints, or any other query.' },
  { bg: '#EDE9FE', color: '#7C3AED', icon: SprayCan, title: 'Premium Products Used', desc: 'Our professionals use only high-quality, dermatologist-approved products for all skin, hair, and wellness services.' },
  { bg: '#F0FDF4', color: '#CA8A04', icon: Star, title: 'Rating & Review System', desc: 'After every service, rate your experience. Reviews are verified and help maintain quality across all professionals.' },
];

const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Pune','Kochi','Lucknow'];
const CITIES_SOON = ['Jaipur','Ahmedabad'];

const ACHIEVEMENTS = [
  { icon: Smartphone, value: '1M+', label: 'App Downloads' },
  { icon: CalendarCheck, value: '1.5M+', label: 'Bookings Completed' },
  { icon: Star, value: '4.7', label: "India's Top Rated Beauty App" },
  { icon: Building2, value: '8+', label: 'Cities in India' },
  { icon: Briefcase, value: '1000+', label: 'Professionals' },
];

const SERVICE_HIGHLIGHTS = [
  { icon: Sparkles, img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=700&q=85&fit=crop', title: 'Salon at Home', desc: 'Beyomo brings beauty home with a full range of salon services — waxing, facials, mani-pedi, clean-ups, body polishing and nourishing hair spa, all just a booking away.' },
  { icon: Waves, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=700&q=85&fit=crop', title: 'Spa at Home', desc: 'Relax and recharge without leaving home. Our soothing body massages help you de-stress, with specialized care for elderly clients, new moms, kids, and period pain.' },
  { icon: Sun, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=700&q=85&fit=crop', title: 'Hydra Facial at Home', desc: 'Bring back your natural glow with professional Hydra Facials at home — deep cleansing, hydration, and instant radiance for healthy, youthful-looking skin.' },
];

const MORE_ABOUT_SECTIONS = [
  { heading: 'Facials & Hydra Facials at Home', text: 'From basic clean-ups to advanced gold, diamond, and Korean facials, our beauticians use premium products to restore your glow. Add our deep-hydrating Hydra Facial for an instant, celebrity-level radiance — all without stepping outside.' },
  { heading: 'Waxing & Threading at Home', text: 'Choose from chocolate waxing, Rica waxing, Brazilian waxing, full-body waxing, and Korean waxing for smooth, long-lasting results. Pair it with precise eyebrow and upper-lip threading for a complete, polished look.' },
  { heading: 'Manicure & Pedicure', text: 'Pamper your hands and feet with classic, French, or deluxe mani-pedi packages that exfoliate, cleanse, and soften skin while leaving your nails perfectly finished.' },
  { heading: 'Haircuts & Styling', text: "Trendy women's, men's, and kids' haircuts, blow-drying, straightening, curling, and event-ready styling — delivered by trained stylists at your doorstep." },
  { heading: 'Bridal & Party Makeup', text: 'From engagement and mehndi looks to the big wedding day, our certified makeup artists craft picture-perfect transformations for every occasion, complete with hairstyling and draping.' },
  { heading: 'Hair Spa & Treatments', text: 'Scalp scrub and massage, henna and herbal application, root touch-ups, hair coloring, and deep-conditioning hair spa — all designed to keep your hair salon-fresh, every time.' },
  { heading: 'Body Massage & Polishing', text: 'Relieve stress with warm oil, energising, or relaxation massages, or reveal radiant skin with body polishing and hydra body polishing treatments using natural scrubs and hydrating serums.' },
  { heading: 'Packages & Combos', text: 'Save more with curated bridal bundles, facial-and-waxing combos, and full grooming kits — tailored to your beauty and wellness needs.' },
];

const FAQS = [
  { q: 'How do I book a service at home with Beyomo?', a: 'Open the Beyomo app or website, enter your location, pick a service and a time slot, and a verified professional will arrive at your doorstep.' },
  { q: 'Are Beyomo professionals verified?', a: 'Yes — every professional undergoes background verification, skill assessment, and hygiene training before being listed on the platform.' },
  { q: 'What if my professional is running late?', a: "We track every booking in real time. If a professional is running late, you'll be notified instantly with a live ETA." },
  { q: 'Can I reschedule or cancel a booking?', a: "Yes, bookings can be rescheduled or cancelled from the app up until shortly before your appointment — see our Cancellation Policy for details." },
  { q: 'What payment methods are supported?', a: 'You can pay via UPI, debit/credit card, or wallet — most services let you pay securely after the service is completed.' },
  { q: 'Is Beyomo available in my city?', a: "We're currently live in 8+ cities including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, Kochi, and Lucknow, with more launching soon." },
  { q: 'Do I need to provide anything for the service?', a: 'No — our professionals arrive fully equipped with all tools, products, and kits needed for your service.' },
  { q: 'How do I become a Beyomo partner professional?', a: 'Tap "Become a Partner" on our website, fill in your details, and our team will reach out to onboard you after verification.' },
];

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

function StatItem({ value, label, icon: Icon }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const isDecimal = /\d+\.\d/.test(String(value));
  const num = parseInt(String(value).replace(/[^0-9]/g, ''));
  const suffix = String(value).replace(/[0-9,]/g, '');
  const count = useCounter(num, 1600, started && !isDecimal);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="stat-item" ref={ref}>
      {Icon && <div className="stat-icon"><Icon size={24} color="#fff" /></div>}
      <div className="stat-val" style={Icon ? { fontSize: 28 } : undefined}>{isDecimal ? value : (started ? count.toLocaleString('en-IN') + suffix : '0' + suffix)}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const s2 = useRevealAll();
  const s3 = useRevealAll();
  const s6 = useRevealAll();
  const s7 = useRevealAll();
  const s8 = useRevealAll();
  const navigate = useNavigate();
  const { city } = useCity();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [moreAboutOpen, setMoreAboutOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getBanners().then(res => setBanners(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    getCategories(city?.id).then(res => setCategories(res?.data || [])).catch(() => {});
  }, [city]);

  const goToServices = () => {
    if (!city) {
      setCityModalOpen(true);
      return;
    }
    navigate('/services');
  };

  const goToCategory = (categoryId) => {
    if (!city) {
      setCityModalOpen(true);
      return;
    }
    navigate(categoryId ? `/services/${categoryId}` : '/services');
  };

  const serviceTiles = categories.length > 0
    ? categories.map(c => ({ key: c.id, id: c.id, title: c.name, img: c.image }))
    : SERVICES.map(s => ({ key: s.title, title: s.title, img: s.img }));

  return (
    <div>
      {/* ══ HERO (fixed brand hero, matches the live site) ══ */}
      <section className="gl-hero">
        <h1 className="sr-only">Beyomo — Book beauty &amp; wellness services at Home</h1>
        <div className="gl-hero-banner">
          <div className="gl-hero-fixed">
            <div className="gl-hero-fixed-photo">
              <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=85&fit=crop" alt="Beyomo salon services at home" loading="eager" />
            </div>
            <div className="gl-hero-fixed-panel">
              <h2 className="gl-hero-serif">Salon Comes Home</h2>
              <div className="gl-hero-rule" />
              <p className="gl-hero-fixed-sub">Book Salon Services at Home</p>
              <div className="gl-hero-pills-row">
                <div className="gl-hero-pill-block"><HomeIcon size={20} /><span>At Home<br />Salon</span></div>
                <div className="gl-hero-pill-block gl-hero-pill-block-alt"><Package size={20} /><span>Variety of<br />Products</span></div>
                <div className="gl-hero-pill-block"><Handshake size={20} /><span>Affordable<br />Services</span></div>
              </div>
            </div>
          </div>
          <div className="gl-hero-location-wrapper">
            <div className="gl-hero-location-section">
              <div className="gl-location-details">
                <div className="gl-location-pin"><MapPin size={18} color="var(--primary)" /></div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{city ? city.name : 'Select your city'}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }} onClick={() => setCityModalOpen(true)} role="button">Change location</p>
                </div>
              </div>
              <button onClick={goToServices} className="gl-explore-btn">Explore Services</button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SPECIAL OFFERS (admin-managed banners) ══ */}
      {banners.length > 0 && (
        <section className="gl-offers-wrapper">
          <p className="gl-offers-label">Special Offers</p>
          <div className="gl-offers-row">
            {banners.map((b, i) => (
              <a key={b.id} className="gl-offer-card" href="#services" onClick={e => { e.preventDefault(); goToServices(); }}>
                {b.image ? (
                  <img src={b.image} alt={b.title} loading="lazy" />
                ) : (
                  <div className="gl-offer-card-fallback" style={{ background: bannerGradient(i) }}>
                    {b.subtitle && <span className="gl-offer-card-sub">{b.subtitle}</span>}
                    <span className="gl-offer-card-title">{b.title}</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ══ SERVICES ══ */}
      <section className="gl-services-wrapper" id="services">
        <span className="badge anim-fadeUp">Top Categories</span>
        <h2 className="section-title anim-fadeUp">Book our services at affordable price</h2>
        <p className="section-sub anim-fadeUp" style={{ margin: '14px 0 0' }}>Pick a category and get a verified professional at your doorstep, on your schedule.</p>
        <div className="gl-services-grid">
          <a className="gl-promo-tile anim-fadeUp d-0" onClick={e => { e.preventDefault(); goToServices(); }} href="#services">
            <img src="/promo/custom_package_banner.png" alt="Make Your Own Package" />
          </a>
          <a className="gl-promo-tile anim-fadeUp d-1" onClick={e => { e.preventDefault(); goToServices(); }} href="#services">
            <img src="/promo/combo_banner.png" alt="Combo Offers" />
          </a>
          {serviceTiles.map((s, i) => (
            <a key={s.key} className={`gl-service-icon-card anim-fadeUp d-${Math.min(i + 2, 9)}`} onClick={e => { e.preventDefault(); goToCategory(s.id); }} href="#services">
              <div className="gl-service-icon-img-wrap">
                <img src={s.img} alt={s.title} loading="lazy" />
              </div>
              <p>{s.title}</p>
            </a>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button onClick={goToServices} className="btn btn-primary">Book a Service →</button>
        </div>
      </section>

      {/* ══ WHY BEYOMO + 3 EASY STEPS (combined panel) ══ */}
      <section className="gl-why-wrapper" id="how-it-works">
        <div className="gl-why-section gl-why-combined">
          <div className="gl-why-col">
            <h2 className="section-title" style={{ fontSize: 28 }}>Why Beyomo?</h2>
            <div className="gl-why-steps">
              {WHY_BEYOMO.map(t => (
                <div className="gl-why-step" key={t}>
                  <span className="gl-why-check"><Check size={14} strokeWidth={3} /></span>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="gl-why-divider" />
          <div className="gl-why-col" ref={s2}>
            <h2 className="section-title reveal" style={{ fontSize: 28 }}>Book in 3 Easy Steps</h2>
            <div className="gl-why-steps reveal-stagger">
              {THREE_STEPS.map(t => (
                <div className="gl-why-step reveal" key={t}>
                  <span className="gl-why-check"><Check size={14} strokeWidth={3} /></span>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 500 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ BRAND STRIP ══ */}
      <section className="gl-brand-strip">
        <div className="container">
          <span className="badge" style={{ background: 'rgba(255,255,255,0.14)', color: 'white' }}>Top Brands</span>
          <h2 style={{ color: 'white', fontSize: 'clamp(20px,2.4vw,28px)', fontWeight: 800, margin: '14px 0 26px' }}>We use best Brands in 1-Time use packs</h2>
          <div className="gl-brand-row">
            {BRANDS.map(b => <span key={b} className="gl-brand-badge">{b}</span>)}
          </div>
        </div>
      </section>

      {/* ══ BECOME YOUR BEST VERSION ══ */}
      <section className="section">
        <div className="container gl-best-version">
          <div>
            <span className="badge">Join The Team</span>
            <h2 className="section-title" style={{ margin: '14px 0 0' }}>Become Your <span style={{ color: 'var(--primary)' }}>Best Version</span></h2>
            <p className="section-sub" style={{ margin: '14px 0 26px' }}>Expert care. Premium services. Because you deserve to shine every day.</p>
            <Link to="/become-a-partner" className="btn btn-primary">Join Now</Link>
          </div>
          <div className="gl-best-version-img">
            <img src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=85&fit=crop" alt="Beyomo professionals" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ══ ACHIEVEMENTS ══ */}
      <div className="stats-banner">
        <div className="container">
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 44, position: 'relative' }}>Delivering Beauty, Creating Trust</h2>
          <div className="stats-banner-grid stats-banner-grid-5">
            {ACHIEVEMENTS.map(a => (
              <StatItem key={a.label} value={a.value} label={a.label} icon={a.icon} />
            ))}
          </div>
        </div>
      </div>

      {/* ══ SERVICES WE OFFER ══ */}
      <section className="section" ref={s6}>
        <div className="container">
          <span className="badge reveal">What We Offer</span>
          <h2 className="section-title reveal">Services We Offer</h2>
          <div className="services-highlight-grid reveal-stagger">
            {SERVICE_HIGHLIGHTS.map(h => (
              <div key={h.title} className="services-highlight-card reveal" onClick={goToServices} role="button">
                <div className="services-highlight-img-wrap">
                  <img src={h.img} alt={h.title} loading="lazy" />
                  <span className="services-highlight-icon-badge"><h.icon size={22} color="#fff" /></span>
                </div>
                <div className="services-highlight-body">
                  <div className="services-highlight-title">{h.title}</div>
                  <p className="services-highlight-desc">{h.desc}</p>
                  <span className="services-highlight-link">Explore <ArrowRight size={15} /></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY BEYOMO ══ */}
      <section className="section" ref={s3}>
        <div className="container">
          <span className="badge reveal">Why Choose Us</span>
          <h2 className="section-title reveal">The Beyomo Difference</h2>
          <p className="section-sub reveal">Every detail of our platform is designed around your safety, comfort, and satisfaction.</p>
          <div className="features-grid reveal-stagger" style={{ marginTop: 52 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card reveal">
                <div className="feature-icon" style={{ background: f.bg }}><f.icon size={26} color={f.color} /></div>
                <div>
                  <div className="feature-title">{f.title}</div>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MORE ABOUT SERVICES (SEO + FAQ) ══ */}
      <section className="section section-alt" ref={s7}>
        <div className="container">
          <div className="more-about-toggle reveal" onClick={() => setMoreAboutOpen(o => !o)}>
            <h2 className="section-title" style={{ fontSize: 26 }}>More About Beyomo Services</h2>
            <span className="faq-chevron" style={{ transform: moreAboutOpen ? 'rotate(180deg)' : 'none', width: 32, height: 32 }}>▾</span>
          </div>
          {moreAboutOpen && (
            <div className="more-about-content">
              <p>Looking good isn't just about beauty — it's about confidence, comfort, and self-care. Visiting a salon regularly often means traffic, long waits, and inconsistent results. <strong>Beyomo</strong> brings professional beauty care straight to your doorstep, with a team of skilled, verified beauticians delivering safe, high-quality salon services at home.</p>
              <p>From facials and waxing to hair care, spa, and bridal services, Beyomo is a complete one-stop solution for all your beauty needs — with the comfort, convenience, and care you can count on, in every city we serve.</p>
              {MORE_ABOUT_SECTIONS.map(sec => (
                <div key={sec.heading}>
                  <h3>{sec.heading}</h3>
                  <p>{sec.text}</p>
                </div>
              ))}

              <h3 style={{ marginTop: 40 }}>Frequently Asked Questions</h3>
              <div style={{ marginTop: 20 }}>
                {FAQS.map((f, i) => (
                  <div key={f.q} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                    <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      {f.q}
                      <span className="faq-chevron">▾</span>
                    </div>
                    <div className="faq-answer"><div className="faq-answer-inner">{f.a}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══ CITIES ══ */}
      <section className="gl-cities-section" id="cities">
        <div className="gl-cities-sub-section">
          <p className="gl-title">Proudly Made in India</p>
          <p className="gl-heading">We Are Live In 8+ Cities</p>
          <div className="gl-cities-container">
            {CITIES.map(c => (
              <button key={c} type="button" className="city-pill" onClick={() => setCityModalOpen(true)}>{c}</button>
            ))}
            {CITIES_SOON.map(c => (
              <span key={c} className="city-pill" style={{ opacity: 0.55, cursor: 'default' }}>{c} · Soon</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST STRIP ══ */}
      <section style={{ padding: '32px 0', background: 'var(--light)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Lock size={14} /> 100% Secure Payments, Powered by Razorpay</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Net Banking'].map((m) => (
              <span key={m} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-full)', padding: '6px 14px' }}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BECOME A PARTNER ══ */}
      <section className="section" id="become-a-partner" ref={s8}>
        <div className="container">
          <div className="reveal" style={{
            background: 'linear-gradient(135deg, var(--dark) 0%, var(--teal) 100%)',
            borderRadius: 28, padding: '56px 40px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}>For Beauty & Wellness Professionals</span>
            <h2 className="section-title" style={{ color: 'white', margin: 0 }}>Grow Your Business With Beyomo</h2>
            <p className="section-sub" style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: 0 }}>
              Join thousands of verified professionals earning flexibly on their own schedule. Get steady bookings, secure payments, and full support — register in minutes.
            </p>
            <Link to="/become-a-partner" style={{
              padding: '14px 32px', background: 'var(--accent)', color: 'var(--dark)',
              borderRadius: 'var(--r-full)', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,149,0,0.35)',
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
            }}><Handshake size={18} /> Become a Partner</Link>
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
                <a href="https://apps.apple.com" target="_blank" rel="noreferrer" className="app-badge-img-link">
                  <img src="/getlook/app_store_download.png" alt="Download on the App Store" />
                </a>
                <a href="https://play.google.com" target="_blank" rel="noreferrer" className="app-badge-img-link">
                  <img src="/getlook/play_store_download.png" alt="Get it on Google Play" />
                </a>
              </div>
              <div style={{ marginTop: 28, fontSize: 14, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarRow size={14} /> 4.8 rating · 10,000+ downloads
              </div>
            </div>

            {/* Phone mockups */}
            <div className="app-screens" style={{ display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'flex-start' }}>
              <div className="anim-float" style={{ background: 'white', borderRadius: 28, width: 200, padding: 16, boxShadow: '0 32px 72px rgba(0,0,0,0.28)' }}>
                <div style={{ background: 'linear-gradient(135deg,var(--teal),var(--primary))', borderRadius: 14, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ color: 'white', textAlign: 'center' }}><Sparkles size={26} /><div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>Book Beauty</div></div>
                </div>
                {[80,48,52,48].map((h,i) => <div key={i} style={{ height: h, background: i===3?'linear-gradient(135deg,var(--teal),var(--primary))':'var(--light)', borderRadius: 10, marginBottom: 10 }} />)}
              </div>
              <div className="anim-float-slow" style={{ background: 'white', borderRadius: 28, width: 200, padding: 16, boxShadow: '0 32px 72px rgba(0,0,0,0.28)', marginTop: 40 }}>
                <div style={{ background: '#FEF3C7', borderRadius: 14, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}><CheckCircle2 size={26} color="#16A34A" /><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dark)', marginTop: 4 }}>Booking Confirmed</div></div>
                </div>
                {[52,72,48,52].map((h,i) => <div key={i} style={{ height: h, background: i===3?'linear-gradient(135deg,var(--teal),var(--primary))':'var(--light)', borderRadius: 10, marginBottom: 10 }} />)}
              </div>
            </div>
          </div>
        </div>
      </section>


      <CitySelectorModal open={cityModalOpen} onClose={() => setCityModalOpen(false)} onSelected={() => navigate('/services')} />

      <style>{`
        @media (max-width: 768px) {
          .app-screens { display: none !important; }
          .app-inner { grid-template-columns: 1fr !important; text-align: center; }
          .app-badges { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
