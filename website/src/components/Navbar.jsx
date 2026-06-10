import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navBg = scrolled || !isHome
    ? 'rgba(255,255,255,0.97)'
    : 'transparent';
  const shadow = scrolled || !isHome ? '0 1px 20px rgba(0,0,0,0.08)' : 'none';
  const textColor = scrolled || !isHome ? '#111827' : 'rgba(255,255,255,0.9)';
  const logoColor = scrolled || !isHome ? '#111827' : 'white';

  const linkStyle = {
    fontSize: 14, fontWeight: 500, color: textColor, transition: 'color 0.2s',
    textDecoration: 'none',
  };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navBg, boxShadow: shadow,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', height: 68, gap: 32 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', flexShrink: 0 }}>B</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: logoColor, transition: 'color 0.3s' }}>Beyomo</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginLeft: 'auto' }} className="nav-links-desktop">
              {isHome ? (
                <>
                  <a href="#services" style={linkStyle}>Services</a>
                  <a href="#how-it-works" style={linkStyle}>How It Works</a>
                  <a href="#testimonials" style={linkStyle}>Reviews</a>
                  <a href="#cities" style={linkStyle}>Cities</a>
                </>
              ) : (
                <Link to="/" style={linkStyle}>Home</Link>
              )}
              <Link to="/join" style={{
                padding: '10px 22px', background: 'var(--accent)', color: 'var(--dark)',
                borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
                textDecoration: 'none',
              }}>
                Join as Pro
              </Link>
              {isHome && (
                <a href="#download" style={{
                  padding: '10px 22px', background: 'var(--primary)', color: 'white',
                  borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700,
                  transition: 'all 0.2s', textDecoration: 'none',
                }}>
                  Download App
                </a>
              )}
            </div>

            <button
              onClick={() => setMenuOpen(v => !v)}
              className="nav-hamburger-btn"
              style={{ display: 'none', flexDirection: 'column', gap: 5, padding: 4, marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ width: 24, height: 2, background: logoColor, borderRadius: 2, display: 'block', transition: 'all 0.3s' }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0, zIndex: 99,
          background: 'white', padding: '20px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {isHome ? (
            <>
              <a href="#services" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Services</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>How It Works</a>
              <a href="#testimonials" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Reviews</a>
              <a href="#cities" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Cities</a>
              <a href="#download" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Download App</a>
            </>
          ) : (
            <Link to="/" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Home</Link>
          )}
          <Link to="/join" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', background: 'var(--accent)', padding: '10px 16px', borderRadius: 'var(--r-full)', textAlign: 'center' }}>
            Join as Professional
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-hamburger-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
