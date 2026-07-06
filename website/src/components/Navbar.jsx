import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, ShoppingBag } from 'lucide-react';
import { useCity } from '../context/CityContext';
import { useCart } from '../context/CartContext';
import CitySelectorModal from './CitySelectorModal';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const { city } = useCity();
  const { count } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const textColor = '#0f0f0f';

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.86)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.08)' : '0 1px 16px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', opacity: scrolled ? 1 : 0.5, transition: 'opacity 0.3s' }} />
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', height: 78, gap: 16 }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--dark) 0%, var(--teal) 55%, var(--primary) 100%)',
                borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center',
                transition: 'transform 0.2s', boxShadow: '0 4px 14px rgba(16,86,65,0.22)',
              }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img src="/logo.png" alt="Beyomo" style={{ height: 26, display: 'block' }} />
              </div>
            </Link>

            {/* City pill */}
            <button
              onClick={() => setCityModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700,
                background: 'var(--light)',
                color: city ? textColor : 'var(--primary)',
                border: '1px solid var(--border)',
                flexShrink: 0, transition: 'var(--transition)',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,86,65,0.12)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <MapPin size={15} color="var(--primary)" />
              {city ? city.name : 'Select City'}
              <ChevronDown size={12} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 'auto' }}>
              {/* Cart */}
              <button onClick={() => navigate('/cart')} aria-label="Cart" style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'transparent',
                border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0, transition: 'var(--transition)',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--light)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <ShoppingBag size={19} color={textColor} />
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px',
                    borderRadius: 'var(--r-full)', background: 'var(--accent)', color: 'white',
                    fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid white',
                  }}>{count}</span>
                )}
              </button>

              {/* Store badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="nav-store-badges">
                <a href="https://apps.apple.com" target="_blank" rel="noreferrer" style={{ transition: 'transform 0.2s', display: 'flex' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img src="/getlook/app_store_download.png" alt="Download on the App Store" style={{ height: 38 }} />
                </a>
                <a href="https://play.google.com" target="_blank" rel="noreferrer" style={{ transition: 'transform 0.2s', display: 'flex' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img src="/getlook/play_store_download.png" alt="Get it on Google Play" style={{ height: 38 }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <CitySelectorModal open={cityModalOpen} onClose={() => setCityModalOpen(false)} />

      <style>{`
        @media (max-width: 560px) {
          .nav-store-badges img { height: 30px !important; }
          .nav-store-badges { gap: 8px !important; }
        }
        @media (max-width: 420px) {
          .nav-store-badges { display: none !important; }
        }
      `}</style>
    </>
  );
}
