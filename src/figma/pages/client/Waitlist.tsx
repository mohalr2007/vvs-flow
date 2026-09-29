import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import ClientNav from '@/figma/components/ClientNav';
import { LocationPicker, type PickedLocation } from '@/figma/components/LocationPicker';
import { bookingService } from '@/lib/services';

const W = '#0891B2';
const EMPTY_LOC: PickedLocation = { address: '', lat: null, lng: null, inside: null, driveMinutes: null };

const URGENCY_OPTIONS = [
  { value: 'Low', label: 'Low — Not urgent', icon: '🟢', desc: 'Can wait a few days or more' },
  { value: 'Normal', label: 'Normal', icon: '🟡', desc: 'Within the next week' },
  { value: 'High', label: 'High — Soon', icon: '🟠', desc: 'Needs attention within 1–2 days' },
];
const FLEX_OPTIONS = [
  { value: 'Flexible', label: 'Flexible', icon: '🗓', desc: 'Any day/time that opens up' },
  { value: 'Fixed — mornings only', label: 'Mornings only', icon: '🌅', desc: 'Before 12:00' },
  { value: 'Fixed — afternoons only', label: 'Afternoons only', icon: '☀️', desc: 'After 12:00' },
];

export default function WaitlistPage() {
  const joinFn = useServerFn(bookingService.joinWaitlist);

  const [form, setForm] = useState({ name: '', email: '', phone: '', title: '' });
  const [loc, setLoc] = useState<PickedLocation>(EMPTY_LOC);
  const [urgency, setUrgency] = useState('Normal');
  const [flex, setFlex] = useState('Flexible');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canSubmit = form.name.trim() && form.email.trim() && form.title.trim() && loc.lat != null && !busy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await joinFn({
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          address: loc.address,
          title: form.title,
          urgency,
          flexibility: flex,
          lat: loc.lat ?? undefined,
          lng: loc.lng ?? undefined,
        },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
        <ClientNav />
        <div className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-md w-full text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{ background: 'rgba(123,97,255,0.1)', border: '2px solid rgba(123,97,255,0.3)', boxShadow: '0 0 40px rgba(123,97,255,0.15)' }}>
              <span style={{ fontSize: 36 }}>⏳</span>
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>
              You're on the list.
            </h1>
            <p style={{ color: '#6DA8C4', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
              A confirmation has been sent to <strong style={{ color: '#D9EEF7' }}>{form.email}</strong>.
              As soon as a cancellation opens near you, you'll get an exclusive 15-minute priority offer.
            </p>
            <div style={{ background: 'rgba(7,26,46,0.75)', border: '1px solid rgba(123,97,255,0.2)', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#7B61FF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>How priority recovery works</div>
              {[
                { icon: '1', text: 'Another customer cancels an appointment.' },
                { icon: '2', text: 'Our system instantly scores every waitlist candidate — you may be the best match.' },
                { icon: '3', text: 'You receive a private link valid for exactly 15 minutes.' },
                { icon: '4', text: 'Accept it in time — the slot is yours. No phone call needed.' },
              ].map(s => (
                <div key={s.icon} className="flex items-start gap-3 mb-3">
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#7B61FF' }}>{s.icon}</div>
                  <span style={{ fontSize: 13, color: '#6DA8C4', lineHeight: 1.5 }}>{s.text}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full btn-water py-3 rounded-xl text-sm font-semibold"
              onClick={() => { setDone(false); setForm({ name: '', email: '', phone: '', title: '' }); setLoc(EMPTY_LOC); }}
            >
              Register another person
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />
      <div className="max-w-xl mx-auto px-6 pt-28 pb-32">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(123,97,255,0.1)', border: '1px solid rgba(123,97,255,0.2)' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#7B61FF', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Priority Waitlist
            </span>
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(32px,6vw,52px)', fontWeight: 300, color: '#D9EEF7', lineHeight: 1.1, marginBottom: 12 }}>
            Join the Priority<br />Waitlist
          </h1>
          <p style={{ color: '#6DA8C4', fontSize: 15, lineHeight: 1.7, maxWidth: 440 }}>
            Mats's schedule is often full days in advance. Register here and you'll be the
            first to know when a cancellation opens near you — with a private booking link
            valid for 15 minutes.
          </p>
        </div>

        {/* How it works banner */}
        <div className="flex gap-3 mb-8 p-4 rounded-xl animate-fade-up"
          style={{ background: 'rgba(8,145,178,0.04)', border: '1px solid rgba(8,145,178,0.12)' }}>
          {['Cancellation detected', '→ System scores matches', '→ You get a 15-min link'].map((s, i) => (
            <div key={i} className="flex-1 text-center">
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#0891B2', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.4 }}>{s}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fade-up">
          {/* Personal info */}
          <div className="p-6 rounded-2xl flex flex-col gap-4"
            style={{ background: 'rgba(7,26,46,0.75)', border: '1px solid rgba(8,145,178,0.1)' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 300, color: '#D9EEF7', marginBottom: 4 }}>Your details</h2>
            {[
              { key: 'name', label: 'Full name *', type: 'text', placeholder: 'Anna Svensson' },
              { key: 'email', label: 'Email address *', type: 'email', placeholder: 'anna@example.com' },
              { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '+46 70 000 00 00' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  className="vvs-input"
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  required={f.key !== 'phone'}
                />
              </div>
            ))}
          </div>

          {/* Service description */}
          <div className="p-6 rounded-2xl flex flex-col gap-4"
            style={{ background: 'rgba(7,26,46,0.75)', border: '1px solid rgba(8,145,178,0.1)' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 300, color: '#D9EEF7', marginBottom: 4 }}>What do you need?</h2>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Service description *
              </label>
              <input
                className="vvs-input"
                placeholder="e.g. Leaking kitchen sink, toilet not flushing, hot water heater replacement…"
                value={form.title}
                onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Urgency
              </label>
              <div className="flex flex-col gap-2">
                {URGENCY_OPTIONS.map(u => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgency(u.value)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      background: urgency === u.value ? 'rgba(8,145,178,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${urgency === u.value ? W : 'rgba(8,145,178,0.1)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{u.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#D9EEF7' }}>{u.label}</div>
                      <div style={{ fontSize: 11, color: '#6DA8C4' }}>{u.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Time preference
              </label>
              <div className="flex gap-2 flex-wrap">
                {FLEX_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFlex(f.value)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      background: flex === f.value ? 'rgba(8,145,178,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${flex === f.value ? W : 'rgba(8,145,178,0.1)'}`,
                      color: flex === f.value ? '#22D3EE' : '#6DA8C4',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{f.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-6 rounded-2xl flex flex-col gap-4"
            style={{ background: 'rgba(7,26,46,0.75)', border: '1px solid rgba(8,145,178,0.1)' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 300, color: '#D9EEF7', marginBottom: 4 }}>Your address</h2>
            <p style={{ fontSize: 13, color: '#6DA8C4', marginTop: -8 }}>
              The system uses your location to find the best match when a cancellation opens nearby.
            </p>
            <LocationPicker
              value={loc}
              onChange={v => setLoc(v)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#EF5350', padding: '12px 16px', background: 'rgba(239,83,80,0.08)', borderRadius: 10, border: '1px solid rgba(239,83,80,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-water py-4 rounded-xl font-semibold text-base transition-all"
            style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
          >
            {busy ? 'Registering…' : '⏳ Join Priority Waitlist →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#2E5B75' }}>
            No payment required. You only commit when you accept a slot offer.
          </p>
        </form>
      </div>
    </div>
  );
}
