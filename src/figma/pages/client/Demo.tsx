import { Link } from '@/figma/router';
import ClientNav from '@/figma/components/ClientNav';

const BEFORE = [
  { icon: '📞', pain: 'Customer calls or texts asking "are you free?"' },
  { icon: '📅', pain: 'Mats checks his paper calendar, texts back a time' },
  { icon: '🔄', pain: '2–3 rounds of back-and-forth to agree on a slot' },
  { icon: '📭', pain: 'No reminder sent — customer forgets, no-show happens' },
  { icon: '🗑️', pain: 'Cancellation leaves a gap — Mats loses a half-day of revenue' },
  { icon: '😤', pain: 'Lead goes cold — no system to track or recover it' },
];

const AFTER = [
  { icon: '🌐', win: 'Customer books online — chooses a real available slot in 3 minutes' },
  { icon: '🤖', win: 'AI reads the problem description and structures the job automatically' },
  { icon: '✅', win: 'Booking confirmed instantly — access instructions sent via private link' },
  { icon: '🔔', win: 'Email confirmation dispatched — no calls needed from either side' },
  { icon: '♻️', win: 'Cancellation triggers 15-min waitlist offer — slot recovered automatically' },
  { icon: '📊', win: 'Every inquiry tracked — Mats sees revenue at risk on his dashboard' },
];

const FLOWS = [
  {
    role: 'Customer',
    color: '#0891B2',
    badge: 'Front door',
    title: 'Book a standard service',
    desc: 'AI reads the description, picks the service type and urgency, shows real available slots with travel time included.',
    href: '/book',
    cta: 'Try the booking flow →',
  },
  {
    role: 'Customer',
    color: '#E53935',
    badge: 'Emergency',
    title: 'Report an emergency',
    desc: 'Fast form — name, address, what\'s happening. ETA card displayed instantly. No phone call needed.',
    href: '/emergency',
    cta: 'Try the emergency flow →',
  },
  {
    role: 'Owner',
    color: '#22C55E',
    badge: 'Dashboard',
    title: 'Owner operations hub',
    desc: 'Action-center shows what needs attention now. Revenue at risk, today\'s timeline, alerts by priority.',
    href: '/dashboard',
    cta: 'Open the dashboard →',
  },
  {
    role: 'Owner',
    color: '#F59E0B',
    badge: 'Waitlist recovery',
    title: 'Cancellation recovery',
    desc: 'Cancelled slot triggers a scan. Best matching waitlist customer gets a 15-minute offer link. One click to send.',
    href: '/dashboard/waitlist',
    cta: 'See the waitlist →',
  },
  {
    role: 'Owner',
    color: '#7B61FF',
    badge: 'AI Inbox',
    title: 'Parse inbound messages',
    desc: 'Paste any raw customer message. AI turns it into a structured job with urgency, duration, and price range.',
    href: '/dashboard/inbox',
    cta: 'Try the AI inbox →',
  },
  {
    role: 'Owner',
    color: '#B87333',
    badge: 'Leads',
    title: 'Lead follow-up tracker',
    desc: 'Every inquiry that didn\'t convert stays visible. Mats can recover abandoned leads with one click.',
    href: '/dashboard/leads',
    cta: 'See leads →',
  },
];

const QUIRKS = [
  { label: 'Business', value: 'Ekström VVS — solo plumber, Västerås, Sweden. Est. 1994.' },
  { label: 'Owner', value: 'Mats Ekström — does the work and manages the business alone.' },
  { label: 'Busy hours', value: 'Tues–Thurs 09:00–16:00 always fully booked. Mon/Fri have gaps.' },
  { label: 'No-show problem', value: '~1 no-show per week. Each gap costs ~2 200–3 400 SEK.' },
  { label: 'Waitlist', value: '4–6 customers always waiting for a slot. None knew about each other.' },
  { label: 'Lead loss', value: 'Mats used to lose 2–3 inquiries/week — buried in WhatsApp threads.' },
  { label: 'ROT deductions', value: 'Swedish homeowners get 30–50% back via ROT. Mats handles the paperwork manually.' },
];

export default function Demo() {
  return (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: '-5%', width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(184,115,51,0.06) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full"
            style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Lovable Challenge — Demo Guide
            </span>
          </div>

          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 300, color: '#D9EEF7', lineHeight: 1.05, marginBottom: 20 }}>
            VVS Flow
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', color: '#6DA8C4', lineHeight: 1.7, marginBottom: 8, maxWidth: 640, margin: '0 auto 8px' }}>
            <strong style={{ color: '#22D3EE' }}>Ekström VVS</strong> — a solo Swedish plumber in Västerås.
          </p>
          <p style={{ fontSize: 16, color: '#4A8BAA', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
            Problem solved: turning every "can I book with you?" into a confirmed appointment — with zero back-and-forth for the owner.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/book" className="btn-water no-underline inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold">
              Try the booking flow →
            </Link>
            <Link to="/dashboard" className="btn-ghost no-underline inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold">
              Open the dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Business Brief ─────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(8,145,178,0.1)', background: 'linear-gradient(180deg, #030E1C 0%, #071A2E 100%)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #B87333)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#B87333', letterSpacing: '0.14em', textTransform: 'uppercase' }}>The client brief</span>
          </div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 300, color: '#D9EEF7', marginBottom: 32, lineHeight: 1.1 }}>
            Ekström VVS — a believable small business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUIRKS.map((q) => (
              <div key={q.label} className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(7,26,46,0.6)', border: '1px solid rgba(8,145,178,0.1)' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B87333', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, paddingTop: 2, minWidth: 80 }}>
                  {q.label}
                </span>
                <span style={{ fontSize: 14, color: '#A8CCE0', lineHeight: 1.6 }}>{q.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ─────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(8,145,178,0.1)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #0891B2)' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.14em', textTransform: 'uppercase' }}>The transformation</span>
              <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, #0891B2, transparent)' }} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: '#D9EEF7', lineHeight: 1.1 }}>
              Before VVS Flow vs. After
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(229,57,53,0.04)', border: '1px solid rgba(229,57,53,0.15)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#E53935', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
                ✕ Before
              </div>
              <div className="flex flex-col gap-3">
                {BEFORE.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
                    <span style={{ fontSize: 14, color: '#8BA8BB', lineHeight: 1.6 }}>{b.pain}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#22C55E', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
                ✓ After VVS Flow
              </div>
              <div className="flex flex-col gap-3">
                {AFTER.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                    <span style={{ fontSize: 14, color: '#A8CCE0', lineHeight: 1.6 }}>{a.win}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Impact stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { value: '0', unit: 'phone calls', label: 'to confirm a booking' },
              { value: '3 min', unit: '', label: 'average booking time' },
              { value: '15 min', unit: 'offer', label: 'to fill a cancelled slot' },
              { value: '100%', unit: '', label: 'of inquiries tracked' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-5 text-center"
                style={{ background: 'rgba(7,26,46,0.7)', border: '1px solid rgba(8,145,178,0.12)' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#22D3EE', lineHeight: 1 }}>
                  {stat.value}<span style={{ fontSize: 14, color: '#0891B2' }}>{stat.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6DA8C4', marginTop: 6, lineHeight: 1.4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Flows ─────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(8,145,178,0.1)', background: 'linear-gradient(180deg, #071A2E 0%, #030E1C 100%)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #0891B2)' }} />
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Explore the build</span>
              <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, #0891B2, transparent)' }} />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, color: '#D9EEF7', lineHeight: 1.1 }}>
              Key flows to walk through
            </h2>
            <p style={{ fontSize: 15, color: '#6DA8C4', marginTop: 12, maxWidth: 520, margin: '12px auto 0' }}>
              Click any card to go directly to that part of the experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FLOWS.map((flow) => (
              <Link
                key={flow.href}
                to={flow.href}
                className="no-underline group"
              >
                <div
                  className="h-full rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: 'rgba(7,26,46,0.65)',
                    border: `1px solid rgba(8,145,178,0.12)`,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${flow.color}40`;
                    el.style.transform = 'translateY(-4px)';
                    el.style.boxShadow = `0 16px 48px ${flow.color}12`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = 'rgba(8,145,178,0.12)';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                        background: `${flow.color}15`, color: flow.color,
                      }}
                    >
                      {flow.badge}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{
                        fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.04)', color: '#4A8BAA',
                      }}
                    >
                      {flow.role}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 400, color: '#D9EEF7', marginBottom: 10, lineHeight: 1.2 }}>
                    {flow.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6DA8C4', lineHeight: 1.65, marginBottom: 20 }}>
                    {flow.desc}
                  </p>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: flow.color, letterSpacing: '0.06em' }}>
                    {flow.cta}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ─────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(8,145,178,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, #0891B2)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Under the hood</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Frontend', value: 'TanStack Start + React' },
              { label: 'Database', value: 'Supabase (Postgres + RLS)' },
              { label: 'AI', value: 'Gemini Flash — intake parsing' },
              { label: 'Maps', value: 'OpenStreetMap / Nominatim / OSRM' },
              { label: 'Email', value: 'Resend via Lovable gateway' },
              { label: 'Design', value: 'Figma → coded system' },
              { label: 'Auth', value: 'Supabase owner-role gating' },
              { label: 'Built with', value: 'Lovable' },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl"
                style={{ background: 'rgba(7,26,46,0.5)', border: '1px solid rgba(8,145,178,0.08)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 13, color: '#A8CCE0' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(8,145,178,0.08)', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#2E5B75', letterSpacing: '0.06em' }}>
          VVS Flow · Built for the Lovable Challenge 2026 · Ekström VVS · Västerås
        </span>
      </footer>
    </div>
  );
}
