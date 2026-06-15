import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', flexShrink: 0 }}>B</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Beyomo</span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)', maxWidth: 260, marginBottom: 20 }}>
              Beauty &amp; Wellness at Your Doorstep. Book certified professionals for any service — at home, on your schedule.
            </p>
            <div className="footer-social">
              <a href="#" title="Facebook">📘</a>
              <a href="#" title="Instagram">📸</a>
              <a href="#" title="Twitter">🐦</a>
              <a href="#" title="YouTube">▶️</a>
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Download the App</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href="#" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>🍎 App Store</a>
                <a href="#" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 6 }}>▶️ Google Play</a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="footer-heading">Services</div>
            <div className="footer-links">
              {['Facial & Skin Care','Hair Care','Makeup','Waxing & Threading','Nail Care','Massage & Wellness','Bridal Packages'].map(s => <a key={s} href="#">{s}</a>)}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="footer-heading">Company</div>
            <div className="footer-links">
              <Link to="/about">About Us</Link>
              <a href="#">Blog</a>
              <a href="#">Press</a>
              <Link to="/contact">Contact</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <div className="footer-heading">Support</div>
            <div className="footer-links">
              <Link to="/help">Help Center</Link>
              <a href="#">Track Booking</a>
              <Link to="/cancellation">Cancellation Policy</Link>
              <Link to="/refund">Refund Policy</Link>
              <a href="#">Safety Guidelines</a>
            </div>
            <div style={{ marginTop: 24 }}>
              <div className="footer-heading">Contact</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 2 }}>
                <div>✉️ support@beyomo.com</div>
                <div>📞 +91 1800-XXX-XXXX</div>
                <div>🕐 Mon–Sun, 8 AM–10 PM</div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div style={{ color: 'rgba(255,255,255,0.38)' }}>© 2026 Beyomo Technologies Pvt. Ltd. All rights reserved.</div>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
