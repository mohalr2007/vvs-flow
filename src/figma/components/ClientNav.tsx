import { useState, useEffect } from 'react';
import { Link, useLocation } from '@/figma/router';

export default function ClientNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/book', label: 'Book' },
    { href: '/demo', label: '✦ Demo' },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(3,14,28,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(8,145,178,0.12)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-7 h-7 rounded-md flex items-center justify-center transition-all group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #0891B2, #22D3EE)' }}>
            <span style={{ fontSize: 13, color: '#030E1C', fontWeight: 800, fontFamily: 'Fraunces, serif' }}>E</span>
          </div>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 400, color: '#D9EEF7' }}>
            Ekström
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            VVS
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              to={l.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
              style={{
                color: location.pathname === l.href ? '#22D3EE' : '#6DA8C4',
                background: location.pathname === l.href ? 'rgba(8,145,178,0.1)' : 'transparent',
              }}
              onMouseEnter={e => { if (location.pathname !== l.href) (e.target as HTMLElement).style.color = '#D9EEF7'; }}
              onMouseLeave={e => { if (location.pathname !== l.href) (e.target as HTMLElement).style.color = '#6DA8C4'; }}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/book"
            className="ml-2 px-5 py-2 rounded-lg text-sm font-semibold no-underline btn-water"
            style={{ borderRadius: 10 }}>
            Book now
          </Link>
          <Link to="/emergency"
            className="ml-1 px-4 py-2 rounded-lg text-sm font-semibold no-underline flex items-center gap-1.5"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#EF4444', animation: 'pulse-ring 1.4s infinite' }} />
            Emergency
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 transition-all duration-300"
            style={{ background: '#D9EEF7', transform: open ? 'rotate(45deg) translateY(6px)' : 'none' }} />
          <span className="block w-5 h-0.5 transition-all duration-300"
            style={{ background: '#D9EEF7', opacity: open ? 0 : 1 }} />
          <span className="block w-5 h-0.5 transition-all duration-300"
            style={{ background: '#D9EEF7', transform: open ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden animate-fade-in"
          style={{ background: 'rgba(3,14,28,0.97)', borderBottom: '1px solid rgba(8,145,178,0.1)' }}>
          <div className="px-6 py-4 flex flex-col gap-1">
            {[...links, { href: '/emergency', label: 'Emergency' }].map(l => (
              <Link key={l.href} to={l.href} onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium no-underline"
                style={{ color: location.pathname === l.href ? '#22D3EE' : '#D9EEF7' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
