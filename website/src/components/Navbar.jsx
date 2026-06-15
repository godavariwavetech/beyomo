import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home', href: '/', type: 'link' },
  {
    label: 'Company', type: 'dropdown',
    items: [
      { label: '🏢 About Us', href: '/about' },
      { label: '📞 Contact', href: '/contact' },
    ],
  },
  {
    label: 'Support', type: 'dropdown',
    items: [
      { label: '❓ Help Center', href: '/help' },
      { label: '🔄 Cancellation Policy', href: '/cancellation' },
      { label: '💸 Refund Policy', href: '/refund' },
    ],
  },
];

function DropdownMenu({ items, visible }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 12px)', left: '50%',
      background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.12)', padding: '8px', minWidth: 200, zIndex: 200,
      opacity: visible ? 1 : 0, pointerEvents: visible ? 'all' : 'none',
      transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
      transition: 'opacity 0.2s, transform 0.2s',
    }}>
      <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 12, height: 12, background: 'white', border: '1px solid var(--border)', borderBottom: 'none', borderRight: 'none', rotate: '45deg' }} />
      {items.map(item => (
        <Link key={item.href} to={item.href} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 10, fontSize: 14, fontWeight: 500, color: 'var(--text)',
          transition: 'background 0.15s, color 0.15s', textDecoration: 'none',
        }}
          onMouseOver={e => { e.currentTarget.style.background = 'var(--light)'; e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text)'; }}
        >{item.label}</Link>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDrop, setOpenDrop] = useState(null);
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setOpenDrop(null); }, [pathname]);

  useEffect(() => {
    const handler = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpenDrop(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const solid = scrolled || !isHome;
  const textColor = solid ? '#111827' : 'rgba(255,255,255,0.9)';
  const logoColor = solid ? '#111827' : 'white';

  const linkBase = { fontSize: 14, fontWeight: 500, color: textColor, transition: 'color 0.2s', textDecoration: 'none', padding: '6px 2px', position: 'relative' };

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: solid ? 'rgba(255,255,255,0.97)' : 'transparent',
        boxShadow: solid ? '0 1px 24px rgba(0,0,0,0.07)' : 'none',
        backdropFilter: solid ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: solid ? 'blur(14px)' : 'none',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', height: 70, gap: 28 }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', boxShadow: '0 4px 12px rgba(253,215,122,0.35)', transition: 'transform 0.2s' }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >B</div>
              <span style={{ fontSize: 20, fontWeight: 800, color: logoColor, transition: 'color 0.35s' }}>Beyomo</span>
            </Link>

            {/* Desktop nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }} className="nav-desktop" ref={dropRef}>
              {/* Home anchor links */}
              {isHome && (
                <>
                  <a href="#services" style={linkBase} onMouseOver={e => e.target.style.color = solid ? 'var(--primary)' : 'var(--accent)'} onMouseOut={e => e.target.style.color = textColor}>Services</a>
                  <a href="#how-it-works" style={{ ...linkBase, marginLeft: 16 }} onMouseOver={e => e.target.style.color = solid ? 'var(--primary)' : 'var(--accent)'} onMouseOut={e => e.target.style.color = textColor}>How It Works</a>
                  <a href="#testimonials" style={{ ...linkBase, marginLeft: 16 }} onMouseOver={e => e.target.style.color = solid ? 'var(--primary)' : 'var(--accent)'} onMouseOut={e => e.target.style.color = textColor}>Reviews</a>
                </>
              )}

              {/* Dropdown menus */}
              {NAV_LINKS.filter(n => n.type === 'dropdown').map(nav => (
                <div key={nav.label} style={{ position: 'relative', marginLeft: 16 }}
                  onMouseEnter={() => setOpenDrop(nav.label)}
                  onMouseLeave={() => setOpenDrop(null)}
                >
                  <button style={{ ...linkBase, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onMouseOver={e => e.currentTarget.style.color = solid ? 'var(--primary)' : 'var(--accent)'}
                    onMouseOut={e => e.currentTarget.style.color = openDrop === nav.label ? (solid ? 'var(--primary)' : 'var(--accent)') : textColor}
                  >
                    {nav.label}
                    <span style={{ fontSize: 9, transition: 'transform 0.2s', display: 'inline-block', transform: openDrop === nav.label ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  <DropdownMenu items={nav.items} visible={openDrop === nav.label} />
                </div>
              ))}

              <div style={{ width: 1, height: 22, background: solid ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)', margin: '0 12px' }} />

              <Link to="/contact" style={{ padding: '10px 22px', background: 'var(--accent)', color: 'var(--dark)', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, transition: 'all 0.2s', textDecoration: 'none', boxShadow: '0 4px 14px rgba(253,215,122,0.35)' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(253,215,122,0.45)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(253,215,122,0.35)'; }}
              >Contact Us</Link>

              {isHome && (
                <a href="#download" style={{ padding: '10px 22px', background: solid ? 'var(--primary)' : 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 'var(--r-full)', fontSize: 14, fontWeight: 700, transition: 'all 0.2s', textDecoration: 'none', border: solid ? 'none' : '1.5px solid rgba(255,255,255,0.3)', marginLeft: 8, backdropFilter: 'blur(4px)' }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = '1'; }}
                >📱 Download</a>
              )}
            </div>

            {/* Hamburger */}
            <button onClick={() => setMenuOpen(v => !v)} className="nav-hamburger" style={{ display: 'none', flexDirection: 'column', gap: 5, padding: 6, marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', zIndex: 101 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width: 24, height: 2.5, background: logoColor, borderRadius: 2, display: 'block', transition: 'all 0.3s',
                  transform: menuOpen ? (i === 0 ? 'rotate(45deg) translateY(10px)' : i === 2 ? 'rotate(-45deg) translateY(-10px)' : 'scaleX(0)') : 'none',
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div style={{
        position: 'fixed', top: 70, left: 0, right: 0, zIndex: 99,
        background: 'white', boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
        borderTop: '1px solid var(--border)',
        transform: menuOpen ? 'translateY(0)' : 'translateY(calc(-100% - 75px))',
        transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        padding: menuOpen ? '20px 24px 28px' : 0,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {isHome && (
            <>
              {['#services:Services','#how-it-works:How It Works','#testimonials:Reviews','#cities:Cities'].map(x => {
                const [href, label] = x.split(':');
                return <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'block' }}>{label}</a>;
              })}
            </>
          )}
          {!isHome && <Link to="/" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'block' }}>🏠 Home</Link>}

          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', padding: '14px 0 6px' }}>Company</div>
          {['/about:🏢 About Us','/contact:📞 Contact'].map(x => {
            const [href, label] = x.split(':');
            return <Link key={href} to={href} onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'block' }}>{label}</Link>;
          })}

          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', padding: '14px 0 6px' }}>Support</div>
          {['/help:❓ Help Center','/cancellation:🔄 Cancellation Policy','/refund:💸 Refund Policy'].map(x => {
            const [href, label] = x.split(':');
            return <Link key={href} to={href} onClick={() => setMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'block' }}>{label}</Link>;
          })}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Link to="/contact" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--accent)', color: 'var(--dark)', borderRadius: 'var(--r-full)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Contact Us</Link>
            {isHome && <a href="#download" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--r-full)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>📱 Download</a>}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
