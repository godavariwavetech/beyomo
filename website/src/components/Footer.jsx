import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 0 }}>
              <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', flexShrink: 0 }}>B</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Beyomo</span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: '16px 0 24px', opacity: 0.7 }}>Beauty &amp; Wellness at Your Doorstep. Book certified professionals for any service — at home, on your schedule.</p>
            <div className="footer-social">
              <a href="#">📘</a><a href="#">📸</a><a href="#">🐦</a><a href="#">▶️</a>
            </div>
          </div>
          <div>
            <div className="footer-heading">Services</div>
            <div className="footer-links">
              {['Facial & Skin Care','Hair Care','Makeup','Waxing & Threading','Nail Care','Massage & Wellness','Bridal Packages'].map(s => <a key={s} href="#">{s}</a>)}
            </div>
          </div>
          <div>
            <div className="footer-heading">Company</div>
            <div className="footer-links">
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
              <Link to="/join">Partner With Us</Link>
              <a href="#">Contact</a>
            </div>
          </div>
          <div>
            <div className="footer-heading">Support</div>
            <div className="footer-links">
              {['Help Center','Track Booking','Cancellation Policy','Refund Policy','Safety Guidelines'].map(s => <a key={s} href="#">{s}</a>)}
            </div>
            <div style={{ marginTop: 24 }}>
              <div className="footer-heading">Contact</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                support@beyomo.com<br />
                +91 1800-XXX-XXXX<br />
                Mon–Sun, 8am–10pm
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div style={{ color: 'rgba(255,255,255,0.45)' }}>© 2026 Beyomo Technologies Pvt. Ltd. All rights reserved.</div>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
