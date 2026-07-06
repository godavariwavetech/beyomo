import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const iconProps = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function InstagramIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v1.5A5 5 0 0 1 16 8z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="gl-footer">
      <div className="gl-footer-sub">
        <div className="gl-footer-about-links">
          <div className="gl-footer-about">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 14 }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--dark) 0%, var(--teal) 55%, var(--primary) 100%)',
                borderRadius: 9, padding: '7px 14px', display: 'flex', alignItems: 'center',
              }}>
                <img src="/logo.png" alt="Beyomo" style={{ height: 22, display: 'block' }} />
              </div>
            </Link>
            <p className="gl-footer-heading" style={{ marginBottom: 8 }}>About Beyomo</p>
            <p className="gl-footer-text">Beyomo is India's beauty and wellness at-home service brand, bringing trained, verified professionals to your doorstep for facials, hair care, makeup, massage, and more — booked in minutes.</p>
          </div>

          <div>
            <p className="gl-footer-heading">Company</p>
            <div className="gl-footer-links">
              <Link to="/about">About Us</Link>
              <Link to="/become-a-partner">Become a Partner</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms &amp; Conditions</Link>
              <Link to="/contact">Contact Us</Link>
            </div>
          </div>

          <div>
            <p className="gl-footer-heading">Support</p>
            <div className="gl-footer-links">
              <Link to="/help">Help Center</Link>
              <Link to="/cancellation">Cancellation Policy</Link>
              <Link to="/refund">Refund Policy</Link>
              <Link to="/cookies">Cookie Policy</Link>
            </div>
          </div>
        </div>

        <div className="gl-footer-right">
          <div className="gl-footer-issue-box">
            <p className="gl-footer-text-strong">Facing issues? Reach us out at:</p>
            <p className="gl-footer-text">Contact Us <a href="mailto:hi@beyomo.com" style={{ color: 'var(--primary)' }}>hi@beyomo.com</a></p>
          </div>
          <div>
            <p className="gl-footer-text-strong">Experience the Beyomo App</p>
            <div className="gl-footer-app-links">
              <a href="https://apps.apple.com" target="_blank" rel="noreferrer"><img src="/getlook/app_store_download.png" alt="App Store" /></a>
              <a href="https://play.google.com" target="_blank" rel="noreferrer"><img src="/getlook/play_store_download.png" alt="Google Play" /></a>
            </div>
            <p className="gl-footer-text-strong" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>Show some love <Heart size={14} fill="var(--primary)" color="var(--primary)" /> on social media</p>
            <div className="gl-footer-social">
              <a href="#" title="Instagram"><InstagramIcon /></a>
              <a href="#" title="Facebook"><FacebookIcon /></a>
              <a href="#" title="LinkedIn"><LinkedinIcon /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="gl-footer-copyright">
        Copyright © 2026 Beyomo — Beauty &amp; Wellness at Home. All Rights Reserved.
      </div>
    </footer>
  );
}
