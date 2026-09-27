import { Link } from '@/figma/router';
import ClientNav from '@/figma/components/ClientNav';
import { useEffect, useRef, useState } from 'react';
import heroBg from '@/figma/assets/hero-bg.jpg';
import quoteBg from '@/figma/assets/quote-bg.jpg';

function Counter({ target, suffix = '' }: { target: number | string; suffix?: string }) {
  const [val, setVal] = useState(typeof target === 'number' ? 0 : target);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof target !== 'number') return;
    const observer = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) {
        let start = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(timer); }
          else setVal(Math.floor(start));
        }, 28);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function Home() {
  return (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden noise">
        <div className="absolute inset-0">
          {/* Photo plomberie uploadée par l'utilisateur */}
          <img
            src={heroBg}
            alt="Plumbing tools and bathroom pipes"
            className="w-full h-full object-cover"
            style={{ opacity: 0.72, objectPosition: 'center 40%' }}
          />
          {/* Dégradé principal — zone texte à gauche assombrie, photo respire à droite */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(105deg, #030E1C 0%, rgba(3,14,28,0.78) 32%, rgba(3,14,28,0.22) 62%, rgba(3,14,28,0.4) 100%)',
          }} />
          {/* Fondu bas */}
          <div className="absolute bottom-0 left-0 right-0 h-40" style={{
            background: 'linear-gradient(to top, #030E1C, transparent)',
          }} />
          {/* Halo eau subtil */}
          <div className="absolute left-0 bottom-1/4 w-72 h-72 rounded-full pointer-events-none" style={{
            background: 'radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
        </div>

        {/* Lignes décoratives — tuyaux horizontaux */}
        <div className="absolute right-0 top-0 bottom-0 w-px opacity-30" style={{ background: 'linear-gradient(to bottom, transparent, #0891B2, #22D3EE, transparent)' }} />
        <div className="absolute opacity-20" style={{ right: 80, top: '15%', width: 1, height: '70%', background: 'linear-gradient(to bottom, transparent, rgba(8,145,178,0.5), transparent)' }} />
        <div className="absolute opacity-10" style={{ right: 40, top: '25%', width: 1, height: '50%', background: 'linear-gradient(to bottom, transparent, #B87333, transparent)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="max-w-2xl">
            <div className="animate-fade-up flex items-center gap-3 mb-8">
              <span className="inline-block w-8 h-0.5" style={{ background: 'linear-gradient(90deg, #0891B2, #22D3EE)' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Västerås · Est. 1994
              </span>
            </div>

            <h1 className="animate-fade-up delay-100" style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 300, lineHeight: 1.05, color: '#D9EEF7', marginBottom: 24 }}>
              Plumbing done<br />
              <em style={{ fontStyle: 'italic', color: '#22D3EE' }}>right.</em>
            </h1>

            <p className="animate-fade-up delay-200" style={{ fontSize: 18, color: '#6DA8C4', lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
              Answers without delay. Real arrival windows — travel time included. One plumber, full accountability.
            </p>

            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3">
              <Link to="/book"
                className="btn-water no-underline inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold"
                style={{ minWidth: 200 }}>
                <span>Book a service</span>
                <span>→</span>
              </Link>
              <Link to="/emergency"
                className="btn-emergency no-underline inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold"
                style={{ minWidth: 200 }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#fff', animation: 'pulse-ring 1.4s infinite' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#fff' }} />
                </span>
                Emergency help
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.12em' }}>SCROLL</span>
          <div className="w-px h-8 animate-bounce" style={{ background: 'linear-gradient(to bottom, rgba(8,145,178,0.7), transparent)' }} />
        </div>
      </section>

      {/* ── Trust band ────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(90deg, #071A2E, #0B2A45, #071A2E)',
        borderTop: '1px solid rgba(8,145,178,0.15)',
        borderBottom: '1px solid rgba(8,145,178,0.15)',
      }}>
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { stat: '4.9', suffix: '/5', label: 'Customer satisfaction' },
            { stat: 'Same-day', suffix: '', label: 'Emergency availability' },
            { stat: '100%', suffix: '', label: 'Local — Västerås' },
          ].map((item, i) => (
            <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#22D3EE', letterSpacing: '-0.01em' }}>
                {item.stat}<span style={{ fontSize: 20 }}>{item.suffix}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6DA8C4', marginTop: 5, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Plombier en train de travailler */}
          <img
            src="https://images.unsplash.com/photo-1676210134190-3f2c0d5cf58d?w=1920&h=900&fit=crop&auto=format"
            alt="Plumber fixing water heater"
            className="w-full h-full object-cover"
            style={{ opacity: 0.1 }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #030E1C, rgba(3,14,28,0.88), #030E1C)' }} />
          {/* Glow eau droite */}
          <div className="absolute right-0 top-1/3 w-80 h-80 rounded-full pointer-events-none" style={{
            background: 'radial-gradient(circle, rgba(8,145,178,0.12), transparent 70%)',
            filter: 'blur(50px)',
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #0891B2)' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.14em', textTransform: 'uppercase' }}>How it works</span>
              <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, #0891B2, transparent)' }} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 300, color: '#D9EEF7', lineHeight: 1.1 }}>
              Three steps to sorted.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: '01', title: 'Describe the problem', desc: 'In plain words — no technical jargon. Our system understands what you need and gives you a real price range.', icon: '📝' },
              { n: '02', title: 'Choose a real slot', desc: 'Only available times are shown. Arrival windows include travel time — no vague promises, no double-booking.', icon: '🗓' },
              { n: '03', title: 'Stay informed', desc: 'A private link manages access, reschedule, and status. No phone calls required.', icon: '📱' },
            ].map((step, i) => (
              <div
                key={i}
                className="animate-fade-up"
                style={{
                  animationDelay: `${i * 130}ms`,
                  background: 'rgba(7,26,46,0.65)',
                  border: '1px solid rgba(8,145,178,0.14)',
                  borderRadius: 18,
                  padding: '32px 28px',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(8,145,178,0.4)';
                  el.style.transform = 'translateY(-5px)';
                  el.style.boxShadow = '0 20px 60px rgba(8,145,178,0.1)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(8,145,178,0.14)';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div className="flex items-start justify-between mb-6">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.12em' }}>{step.n}</span>
                  <span style={{ fontSize: 26 }}>{step.icon}</span>
                </div>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 400, color: '#D9EEF7', marginBottom: 12, lineHeight: 1.2 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#6DA8C4', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/book" className="btn-water no-underline inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold">
              Start booking →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Honest pricing ─────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, #030E1C 0%, #071A2E 50%, #030E1C 100%)',
        borderTop: '1px solid rgba(8,145,178,0.1)',
      }}>
        <div className="max-w-6xl mx-auto px-6 py-22">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B87333)' }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#B87333', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Our promise</span>
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: '#D9EEF7', lineHeight: 1.15, marginBottom: 20 }}>
                Honest estimates.<br />No surprise invoices.
              </h2>
              <p style={{ fontSize: 15, color: '#6DA8C4', lineHeight: 1.75, marginBottom: 28 }}>
                We give you a price range before we arrive — never a binding quote that could go wrong. Mats approves every job personally.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Price estimate shown before you confirm',
                  'Real arrival windows — travel time included',
                  'ROT tax deduction handled for you',
                  'One plumber. Full responsibility.',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span style={{ color: '#0891B2', fontSize: 15 }}>✓</span>
                    <span style={{ fontSize: 14, color: '#A8CCE0' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
                {/* Goutte d'eau sur tuyau en laiton */}
                <img
                  src="https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?w=800&h=600&fit=crop&auto=format"
                  alt="Water drop on brass pipe"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, transparent, rgba(3,14,28,0.7))' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <div style={{ background: 'rgba(3,14,28,0.88)', backdropFilter: 'blur(16px)', borderRadius: 12, padding: '14px 18px', border: '1px solid rgba(8,145,178,0.25)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.1em', marginBottom: 5, textTransform: 'uppercase' }}>ESTIMATE RANGE</div>
                    <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#D9EEF7', fontWeight: 400 }}>2 200 – 3 400 SEK</div>
                    <div style={{ fontSize: 12, color: '#6DA8C4', marginTop: 3 }}>ROT deduction may apply</div>
                  </div>
                </div>
              </div>
              {/* Glow eau */}
              <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(8,145,178,0.25), transparent 70%)',
                filter: 'blur(24px)',
              }} />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full pointer-events-none" style={{
                background: 'radial-gradient(circle, rgba(184,115,51,0.2), transparent 70%)',
                filter: 'blur(20px)',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Photo band — atelier plomberie ────────────────── */}
      <section className="relative h-72 overflow-hidden" style={{ borderTop: '1px solid rgba(8,145,178,0.1)' }}>
        <img
          src={quoteBg}
          alt="Plumbing tools and fittings wall"
          className="w-full h-full object-cover"
          style={{ opacity: 0.85, objectPosition: 'center center' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(3,14,28,0.55) 0%, rgba(3,14,28,0.18) 50%, rgba(3,14,28,0.45) 100%)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(20px, 3vw, 32px)', fontStyle: 'italic', color: '#22D3EE', fontWeight: 300, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              "Every inquiry gets an outcome."
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="w-8 h-px" style={{ background: 'rgba(184,115,51,0.5)' }} />
              <p style={{ fontSize: 13, color: '#B87333', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}>
                Mats Ekström · Owner, Ekström VVS
              </p>
              <span className="w-8 h-px" style={{ background: 'rgba(184,115,51,0.5)' }} />
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span style={{ color: '#0891B2', fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 13, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.04em' }}>No request falls through the cracks</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(8,145,178,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 300, color: '#D9EEF7', marginBottom: 16, lineHeight: 1.1 }}>
            Ready when you are.
          </h2>
          <p style={{ fontSize: 16, color: '#6DA8C4', marginBottom: 36 }}>
            Book in minutes. Arrive with certainty.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/book" className="btn-water no-underline inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-base font-semibold">
              Book a service
            </Link>
            <Link to="/emergency" className="btn-ghost no-underline inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-base font-semibold">
              Emergency line
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(8,145,178,0.08)', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#2E5B75', letterSpacing: '0.06em' }}>
          © 2026 Ekström VVS · Västerås · +46 21 123 45 67
        </span>
      </footer>
    </div>
  );
}
