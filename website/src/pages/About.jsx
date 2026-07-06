import React from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const VALUES = [
  { icon: '🛡️', bg: '#D1FAE5', title: 'Trust & Safety', desc: 'Every professional is background-verified and trained. We never compromise on the safety of our customers.' },
  { icon: '⭐', bg: '#FEF3C7', title: 'Quality First', desc: 'We set high standards for service quality and enforce them rigorously through our review and rating system.' },
  { icon: '💡', bg: '#DBEAFE', title: 'Innovation', desc: 'We constantly invest in technology to make beauty booking seamless, transparent, and delightful.' },
  { icon: '🤝', bg: '#EDE9FE', title: 'Partner Success', desc: 'Our professionals are our co-founders. We share revenue fairly and help them build sustainable businesses.' },
  { icon: '🌈', bg: '#FEE2E2', title: 'Inclusivity', desc: 'Beauty has no boundaries. We serve customers from all backgrounds and celebrate diversity in our team.' },
  { icon: '♻️', bg: '#D1FAE5', title: 'Sustainability', desc: 'We encourage eco-friendly product usage and reduce paper waste through fully digital operations.' },
];

const TEAM = [
  { initials: 'RK', name: 'Rajiv Kapoor', role: 'Co-Founder & CEO', grad: 'linear-gradient(135deg,#105641,#0b3c2e)', bio: 'Ex-Swiggy product lead with 8 years building marketplace tech at scale.' },
  { initials: 'AS', name: 'Ananya Singh', role: 'Co-Founder & COO', grad: 'linear-gradient(135deg,#9333ea,#6366f1)', bio: 'Serial entrepreneur passionate about empowering women-led businesses.' },
  { initials: 'VN', name: 'Vikram Nair', role: 'Chief Technology Officer', grad: 'linear-gradient(135deg,#0891b2,#0284c7)', bio: "Full-stack engineer and former tech lead at Zomato's growth team." },
  { initials: 'PM', name: 'Priya Mathur', role: 'Head of Operations', grad: 'linear-gradient(135deg,#d97706,#f59e0b)', bio: 'Operations specialist with deep experience scaling platforms to 20+ cities.' },
];

const TIMELINE = [
  { year: '2022', title: 'The Spark', desc: "Rajiv and Ananya noticed how hard it was for freelance beauty professionals to find steady clients. Beyomo's concept was born in a Bangalore apartment." },
  { year: '2023', title: 'Beta Launch · Mumbai', desc: 'Launched with 12 hand-picked professionals in Mumbai. Recorded 500+ bookings in the first month with a 4.7 ★ avg rating.' },
  { year: '2024', title: 'Series A & City Expansion', desc: 'Raised ₹12 Cr in Series A. Expanded to Delhi, Bangalore, Hyderabad, and Chennai. Crossed 1,000 registered professionals.' },
  { year: '2025', title: '8 Cities & Going Strong', desc: 'Now live in 8 cities with 186+ verified pros, 3,800+ services completed, and a community of 2,800+ happy customers.' },
];

export default function About() {
  const pageRef = useRevealAll();

  return (
    <div ref={pageRef}>
      {/* ── Hero ── */}
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Our Story</span>
          <h1 className="anim-fadeUp d-2">
            Redefining Beauty<br />
            <span style={{ color: 'var(--accent)' }}>One Home at a Time</span>
          </h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 16 }}>
            We started Beyomo because beauty professionals deserved better — and so did customers. Today, we're India's fastest-growing at-home beauty platform.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap' }} className="anim-fadeUp d-5">
            <Link to="/contact" className="btn btn-accent">Talk to Us</Link>
            <a href="#download" className="btn btn-outline-white">Get the App</a>
          </div>
        </div>
      </div>

      {/* ── Mission & Vision ── */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }} className="mv-grid">
            <div className="reveal-left" style={{ background: 'linear-gradient(135deg,var(--dark),var(--teal))', borderRadius: 'var(--r-xl)', padding: '52px 44px' }}>
              <div style={{ width: 54, height: 54, background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24 }}>🎯</div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 14 }}>Our Mission</h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.78 }}>To make premium beauty and wellness services accessible to every Indian household — while creating dignified, high-earning careers for beauty professionals, especially women.</p>
            </div>
            <div className="reveal-right" style={{ background: 'linear-gradient(135deg,var(--primary),var(--secondary))', borderRadius: 'var(--r-xl)', padding: '52px 44px' }}>
              <div style={{ width: 54, height: 54, background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 24 }}>🔭</div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 14 }}>Our Vision</h3>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.78 }}>To be the most trusted beauty marketplace in India — where every woman feels safe, every service is world-class, and every professional thrives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="tl-grid">
            <div>
              <span className="badge reveal">Our Journey</span>
              <h2 className="section-title reveal" style={{ marginBottom: 0 }}>How We Got Here</h2>
              <p className="section-sub reveal">From a simple idea born in a living room to a platform trusted by thousands — here's the Beyomo story.</p>
              <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }} className="reveal">
                <Link to="/contact" className="btn btn-primary btn-sm">Contact Us</Link>
                <a href="#download" className="btn btn-secondary btn-sm">Get the App</a>
              </div>
            </div>
            <div className="timeline reveal">
              {TIMELINE.map(item => (
                <div key={item.year} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-year">{item.year}</div>
                  <div className="timeline-title">{item.title}</div>
                  <div className="timeline-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-banner">
        <div className="container">
          <div className="stats-banner-grid">
            {[['2,847+','Happy Customers'],['186','Verified Professionals'],['8','Cities Covered'],['₹35K+','Avg. Monthly Earnings']].map(([v,l]) => (
              <div key={l} className="stat-item">
                <div className="stat-val">{v}</div>
                <div className="stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Values ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="badge reveal">Our Culture</span>
            <h2 className="section-title reveal">What We Stand For</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>These values guide every decision we make — from product features to how we treat our professionals.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginTop: 52 }} className="reveal-stagger values-grid">
            {VALUES.map(v => (
              <div key={v.title} className="value-card reveal">
                <div className="value-icon" style={{ background: v.bg }}>{v.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.68 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="badge reveal">The People</span>
            <h2 className="section-title reveal">Meet the Team</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>A small but mighty team obsessed with quality, fairness, and technology.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22, marginTop: 52 }} className="reveal-stagger team-grid">
            {TEAM.map(m => (
              <div key={m.name} className="team-card reveal">
                <div className="team-banner" style={{ background: m.grad }} />
                <div className="team-avatar" style={{ background: m.grad }}>{m.initials}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: 'var(--secondary)', fontWeight: 600, marginBottom: 12 }}>{m.role}</div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section">
        <div className="container">
          <div className="reveal" style={{ background: 'linear-gradient(135deg,var(--dark) 0%,var(--teal) 60%,var(--primary) 100%)', borderRadius: 'var(--r-xl)', padding: '64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, background: 'radial-gradient(circle,rgba(255,149,0,0.14) 0%,transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, background: 'radial-gradient(circle,rgba(2,176,232,0.16) 0%,transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', padding: '5px 18px', borderRadius: 99, fontSize: 13, fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block', marginBottom: 22 }}>Be Part of It</span>
              <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 800, color: 'white', marginBottom: 14 }}>Be Part of the Beyomo Story</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.7 }}>Whether you're a beauty professional looking to grow your income or a customer seeking convenience — Beyomo is built for you.</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-accent">Contact Us</Link>
                <Link to="/help" className="btn btn-outline-white">Help Center</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media(max-width:900px){.mv-grid,.tl-grid{grid-template-columns:1fr!important;gap:24px!important}}
        @media(max-width:768px){.values-grid{grid-template-columns:repeat(2,1fr)!important}.team-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:480px){.values-grid,.team-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}
