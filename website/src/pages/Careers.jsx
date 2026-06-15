import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const BENEFITS = [
  { icon: '💰', bg: '#D1FAE5', title: 'Competitive Pay', desc: 'Market-leading salaries with performance bonuses and ESOPs for early team members.' },
  { icon: '🏠', bg: '#DBEAFE', title: 'Remote-Friendly', desc: 'Work from anywhere in India. We have offices in Mumbai and Bangalore for those who prefer in-person.' },
  { icon: '🏥', bg: '#FEE2E2', title: 'Health Insurance', desc: 'Comprehensive health insurance for you and your family, including dental and vision coverage.' },
  { icon: '📚', bg: '#FEF3C7', title: 'Learning Budget', desc: '₹30,000/year for courses, conferences, books, and anything that helps you grow professionally.' },
  { icon: '🍽️', bg: '#EDE9FE', title: 'Free Meals', desc: 'Daily catered lunch at our offices, plus a ₹5,000/month meal allowance for remote employees.' },
  { icon: '🌴', bg: '#D1FAE5', title: 'Flexible PTO', desc: 'Unlimited paid time off (with a minimum of 15 days/year) because we trust our team.' },
];

const JOBS = [
  { title: 'Senior Full-Stack Engineer', team: 'Engineering', location: 'Mumbai / Remote', type: 'Full-time', tag: 'Engineering', tagStyle: 'job-tag-blue' },
  { title: 'Product Manager — Growth', team: 'Product', location: 'Mumbai', type: 'Full-time', tag: 'Product', tagStyle: 'job-tag-purple' },
  { title: 'City Operations Lead', team: 'Operations', location: 'Bangalore / Delhi', type: 'Full-time', tag: 'Operations', tagStyle: 'job-tag-green' },
  { title: 'UX Designer', team: 'Design', location: 'Remote', type: 'Full-time', tag: 'Design', tagStyle: 'job-tag-blue' },
  { title: 'Partnership Manager', team: 'Business', location: 'Mumbai', type: 'Full-time', tag: 'Business', tagStyle: 'job-tag-green' },
  { title: 'Data Analyst', team: 'Analytics', location: 'Remote', type: 'Full-time', tag: 'Analytics', tagStyle: 'job-tag-purple' },
];

const VALUES = [
  { icon: '🚀', title: 'Move Fast', desc: 'We ship weekly and iterate constantly. Speed is a competitive advantage.' },
  { icon: '🤝', title: 'Own It', desc: 'Every team member takes full ownership of their area. No one passes the buck.' },
  { icon: '🎯', title: 'Impact-Driven', desc: 'We measure success by real impact — lives improved, professionals empowered.' },
  { icon: '💬', title: 'Radical Candour', desc: 'We give direct, honest feedback with kindness. No politics, no ambiguity.' },
];

export default function Careers() {
  const pageRef = useRevealAll();
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <div ref={pageRef}>
      {/* ── Hero ── */}
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">We're Hiring</span>
          <h1 className="anim-fadeUp d-2">
            Build the Future of<br /><span style={{ color: 'var(--accent)' }}>Beauty in India</span>
          </h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 16 }}>
            Join a passionate team building India's most trusted at-home beauty platform. We're looking for people who care deeply about impact, craft, and community.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 36, flexWrap: 'wrap' }} className="anim-fadeUp d-5">
            <a href="#openings" className="btn btn-accent">View Open Roles ↓</a>
            <Link to="/about" className="btn btn-outline-white">Learn About Us</Link>
          </div>
        </div>
      </div>

      {/* ── Culture Values ── */}
      <section className="section section-alt">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="badge reveal">Our Culture</span>
            <h2 className="section-title reveal">How We Work</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>We've built a culture where talented people do the best work of their lives.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22, marginTop: 52 }} className="reveal-stagger culture-grid">
            {VALUES.map(v => (
              <div key={v.title} className="reveal" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '32px 24px', textAlign: 'center', transition: 'var(--transition)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{v.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{v.title}</div>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <span className="badge reveal">Perks & Benefits</span>
            <h2 className="section-title reveal">We Take Care of Our Team</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>Beyond competitive pay — here's what makes Beyomo a great place to work.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginTop: 52 }} className="reveal-stagger benefits-grid">
            {BENEFITS.map(b => (
              <div key={b.title} className="benefit-card reveal">
                <div className="benefit-icon" style={{ background: b.bg }}>{b.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{b.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Open Positions ── */}
      <section className="section section-alt" id="openings">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="badge reveal">Open Roles</span>
            <h2 className="section-title reveal">Current Openings</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>We hire for skill, culture fit, and growth potential. All roles are open to candidates across India.</p>
          </div>

          <div className="reveal-stagger" style={{ maxWidth: 860, margin: '0 auto' }}>
            {JOBS.map(job => (
              <div key={job.title} className="job-card reveal" onClick={() => setSelectedJob(selectedJob === job.title ? null : job.title)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className={`job-tag ${job.tagStyle}`}>{job.tag}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>• {job.type}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{job.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>🏢 {job.team}</span>
                    <span>📍 {job.location}</span>
                  </div>
                  {selectedJob === job.title && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, marginBottom: 16 }}>
                        We're looking for a talented {job.title} to join our {job.team} team. You'll work closely with cross-functional partners to drive meaningful impact for our customers and professionals. Experience in a fast-growing startup is a plus but not required — we hire for potential.
                      </p>
                      <a href="mailto:careers@beyomo.com?subject=Application for ${job.title}" className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>Apply for This Role →</a>
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 20, color: 'var(--muted)', transition: 'transform 0.3s', display: 'block', transform: selectedJob === job.title ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ textAlign: 'center', marginTop: 36 }}>
            <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 16 }}>Don't see a role that fits? We're always interested in exceptional talent.</p>
            <a href="mailto:careers@beyomo.com" className="btn btn-secondary">📧 Send Us Your CV</a>
          </div>
        </div>
      </section>

      {/* ── Hiring Process ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="badge reveal">Our Process</span>
            <h2 className="section-title reveal">How We Hire</h2>
            <p className="section-sub reveal" style={{ margin: '14px auto 0' }}>We keep our hiring process fast, transparent, and respectful of your time.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }} className="reveal-stagger process-grid">
            {[
              { n: '01', icon: '📝', title: 'Apply', desc: 'Send your CV and a brief note about why you\'d like to join Beyomo.' },
              { n: '02', icon: '📞', title: 'Intro Call', desc: '30-minute call with HR to discuss your background and expectations.' },
              { n: '03', icon: '🛠️', title: 'Technical / Task Round', desc: 'Role-specific assessment or case study. Feedback within 48 hours.' },
              { n: '04', icon: '🤝', title: 'Final Interview', desc: 'Meet the team leads. Culture and values alignment discussion.' },
            ].map(s => (
              <div key={s.n} className="reveal" style={{ background: 'var(--light)', borderRadius: 'var(--r-xl)', padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,var(--teal),var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent)', margin: '0 auto 16px' }}>{s.n}</div>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="stats-banner">
        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 800, color: 'white', marginBottom: 14 }}>Ready to Make an Impact?</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.65 }}>Join a team building something that genuinely changes lives — for customers and professionals alike.</p>
          <a href="mailto:careers@beyomo.com" className="btn btn-accent">📧 careers@beyomo.com</a>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){.culture-grid{grid-template-columns:repeat(2,1fr)!important}.process-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:768px){.benefits-grid{grid-template-columns:repeat(2,1fr)!important}}
        @media(max-width:480px){.culture-grid,.benefits-grid,.process-grid{grid-template-columns:1fr!important}}
      `}</style>
    </div>
  );
}
