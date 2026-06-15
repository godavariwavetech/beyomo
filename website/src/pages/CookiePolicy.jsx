import React from 'react';
import { Link } from 'react-router-dom';
import { useRevealAll } from '../hooks/useReveal';

const COOKIE_TYPES = [
  { icon: '🔒', name: 'Strictly Necessary', color: '#D1FAE5', textColor: '#065F46', desc: 'These cookies are essential for the website to function and cannot be switched off. They are set in response to actions you take such as logging in or filling in forms.', examples: ['Session authentication token', 'CSRF security tokens', 'Load balancer cookies', 'User preference (language, city)'] },
  { icon: '📊', name: 'Analytics & Performance', color: '#DBEAFE', textColor: '#1D4ED8', desc: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.', examples: ['Page views and traffic sources', 'Time spent on pages', 'Error tracking and monitoring', 'A/B testing variants'] },
  { icon: '⚙️', name: 'Functional', color: '#FEF3C7', textColor: '#92400E', desc: 'These cookies enable enhanced functionality and personalisation. If you disable them, some features may not work correctly.', examples: ['Remembering your city preference', 'Keeping you logged in', 'Your notification settings', 'Recently viewed services'] },
  { icon: '🎯', name: 'Marketing (Optional)', color: '#EDE9FE', textColor: '#6D28D9', desc: 'These cookies may be set by our advertising partners to build a profile of your interests. We use these only with your explicit consent.', examples: ['Retargeting ads', 'Conversion tracking', 'Social media pixels (if enabled)', 'Partner referral tracking'] },
];

export default function CookiePolicy() {
  const pageRef = useRevealAll();
  return (
    <div ref={pageRef}>
      <div className="page-hero">
        <div className="container page-hero-inner">
          <span className="badge anim-fadeUp d-1">Legal</span>
          <h1 className="anim-fadeUp d-2">Cookie Policy</h1>
          <p className="anim-fadeUp d-3" style={{ marginTop: 14 }}>How Beyomo uses cookies and similar tracking technologies on our website and app.</p>
        </div>
      </div>

      <div className="container">
        <div className="legal-layout">
          <aside className="legal-toc">
            <div className="legal-toc-title">Contents</div>
            {['What Are Cookies','Types We Use','Cookie Consent','Managing Cookies','Third-Party Cookies','Changes','Contact'].map((t,i) => (
              <a key={t} href={`#sec${i+1}`}>{i+1}. {t}</a>
            ))}
          </aside>
          <main className="legal-content reveal">
            <div className="legal-meta">
              <span className="legal-pill">📅 Last updated: June 14, 2026</span>
            </div>

            <div id="sec1" className="legal-section">
              <h2>1. What Are Cookies?</h2>
              <p>Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the site owners. Cookies help us remember your preferences, understand how you use our site, and improve your overall experience.</p>
              <p>Similar technologies such as web beacons, pixel tags, and local storage may also be used and are referred to collectively as "cookies" in this policy.</p>
            </div>

            <div id="sec2" className="legal-section">
              <h2>2. Types of Cookies We Use</h2>
              <p>We use the following categories of cookies on the Beyomo platform:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginTop: 20 }} className="cookie-grid">
                {COOKIE_TYPES.map(c => (
                  <div key={c.name} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', transition: 'var(--transition)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 22 }}>{c.icon}</span>
                      <span style={{ background: c.color, color: c.textColor, padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700 }}>{c.name}</span>
                    </div>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 14 }}>{c.desc}</p>
                    <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>Examples:</div>
                    <ul style={{ margin: 0, padding: 0 }}>
                      {c.examples.map(e => <li key={e} style={{ fontSize: 13, color: 'var(--muted)', paddingLeft: 16, position: 'relative', marginBottom: 4, lineHeight: 1.5 }}><span style={{ position: 'absolute', left: 0 }}>•</span>{e}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div id="sec3" className="legal-section">
              <h2>3. Cookie Consent</h2>
              <p>When you first visit our website, you will be shown a cookie banner that allows you to accept or reject non-essential cookies. Strictly necessary cookies are always active as they are essential for the site to function.</p>
              <div className="legal-highlight">
                You can withdraw your consent at any time by clearing your cookies in your browser settings or by using the "Cookie Preferences" option in our website footer.
              </div>
            </div>

            <div id="sec4" className="legal-section">
              <h2>4. Managing Cookies</h2>
              <p>You can control and manage cookies in various ways:</p>
              <ul>
                <li><strong>Browser Settings:</strong> Most browsers allow you to view, delete, and block cookies from websites. Check your browser's Help section for instructions.</li>
                <li><strong>Our Cookie Banner:</strong> Use the "Cookie Preferences" link in our footer to update your consent at any time.</li>
                <li><strong>Mobile Apps:</strong> For our mobile app, you can manage tracking permissions through your device's privacy settings (iOS Settings → Privacy, or Android Settings → Apps).</li>
              </ul>
              <p>Please note that disabling certain cookies may affect the functionality of our website and app.</p>
            </div>

            <div id="sec5" className="legal-section">
              <h2>5. Third-Party Cookies</h2>
              <p>Some cookies on our platform are set by third-party services that appear on our pages. We use the following third-party services that may set cookies:</p>
              <ul>
                <li><strong>Razorpay</strong> – Payment processing (strictly necessary)</li>
                <li><strong>Firebase / Google Analytics</strong> – App analytics and crash reporting</li>
                <li><strong>MSG91</strong> – OTP and notification delivery</li>
              </ul>
              <p>These third parties have their own privacy and cookie policies, which we encourage you to review.</p>
            </div>

            <div id="sec6" className="legal-section">
              <h2>6. Changes to This Policy</h2>
              <p>We may update this Cookie Policy from time to time. We will notify you of significant changes by posting a notice on our website and updating the "Last Updated" date. Your continued use of our platform constitutes acceptance of the updated policy.</p>
            </div>

            <div id="sec7" className="legal-section">
              <h2>7. Contact Us</h2>
              <p>If you have any questions about our use of cookies, please contact us at <strong>privacy@beyomo.com</strong> or visit our <Link to="/contact" style={{ color: 'var(--primary)', fontWeight: 600 }}>Contact page</Link>.</p>
            </div>
          </main>
        </div>
      </div>

      <style>{`@media(max-width:768px){.cookie-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
