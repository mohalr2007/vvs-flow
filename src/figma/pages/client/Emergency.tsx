import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Link } from '@/figma/router';
import ClientNav from '@/figma/components/ClientNav';
import { bookingService } from '@/lib/services';
import { uploadPhoto } from '@/lib/upload';
import { fmtTime } from '@/lib/time';
import { LocationPicker, type PickedLocation } from '@/figma/components/LocationPicker';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');
type Result = Awaited<ReturnType<typeof bookingService.create>>;

const EMPTY_FORM = { name: '', phone: '', email: '', description: '' };
const EMPTY_LOC: PickedLocation = { address: '', lat: null, lng: null, inside: null, driveMinutes: null };

export default function Emergency() {
  const create = useServerFn(bookingService.create);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loc, setLoc] = useState<PickedLocation>(EMPTY_LOC);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  // Clear state on mount so previous emergency form data doesn't persist
  useEffect(() => {
    setForm(EMPTY_FORM);
    setLoc(EMPTY_LOC);
    setPhoto(null);
    setError('');
    setResult(null);
  }, []);

  const ok =
    form.name.trim().length > 1 &&
    form.phone.replace(/\D/g, '').length >= 7 &&
    loc.address.trim().length >= 4 &&
    form.description.trim().length > 3 &&
    loc.inside !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const photoPath = photo ? await uploadPhoto(photo) : null;
      const r = await create({
        data: {
          kind: 'emergency',
          ...form,
          address: loc.address,
          title: 'Emergency leak',
          urgency: 'Emergency',
          duration_min: 90,
          price_high: null,
          confidence: null,
          missing_fields: null,
          slotStart: null,
          photoPath,
          lat: loc.lat ?? null,
          lng: loc.lng ?? null,
        },
      });
      setResult(r);
    } catch (err) { setError(errMsg(err)); toast.error(errMsg(err)); } finally { setLoading(false); }
  };

  if (result?.eta) {
    return (
      <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
        <ClientNav />
        <div className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-md w-full text-center animate-scale-in">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(229,57,53,0.1)', border: '2px solid rgba(229,57,53,0.3)' }}>
                <span style={{ fontSize: 40 }}>🚨</span>
              </div>
              <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(229,57,53,0.3)', animation: 'pulse-ring 1.5s infinite', animationDelay: '0ms' }} />
              <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(229,57,53,0.2)', animation: 'pulse-ring 1.5s infinite', animationDelay: '500ms' }} />
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Request received.</h1>
            <p style={{ color: '#6DA8C4', marginBottom: 28, lineHeight: 1.6 }}>Mats is being notified now. Here is your estimated arrival window:</p>
            <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(229,57,53,0.06)', border: '2px solid rgba(229,57,53,0.2)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#E53935', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>Estimated arrival window</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 52, fontWeight: 300, color: '#D9EEF7', lineHeight: 1 }}>{fmtTime(result.eta.from)}–{fmtTime(result.eta.to)}</div>
              <div style={{ fontSize: 13, color: '#6DA8C4', marginTop: 8 }}>Based on current load and your zone. Reference {result.ref}.</div>
            </div>
            <div className="flex flex-col gap-3">
              <a href="tel:+46211234567" className="btn-water no-underline flex items-center justify-center gap-2 py-4 rounded-xl font-semibold">📞 Call Ekström VVS directly</a>
              {result.accessToken && (
                <Link to={`/access/${result.accessToken}`} className="btn-ghost no-underline flex items-center justify-center py-4 rounded-xl font-semibold">
                  View request status →
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setForm({ name: '', phone: '', email: '', description: '' });
                  setLoc(EMPTY_LOC);
                  setPhoto(null);
                  setError('');
                }}
                className="btn-ghost flex items-center justify-center py-3 rounded-xl text-sm font-semibold"
              >
                Submit another request +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />
      <div className="max-w-lg mx-auto px-6 pt-28 pb-32">
        <div className="animate-fade-up mb-8 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.25)' }}>
          <div className="relative flex-shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ background: '#E53935' }} />
            <div className="absolute inset-0 rounded-full" style={{ background: '#E53935', animation: 'pulse-ring 1.2s infinite' }} />
          </div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#EF5350', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Urgent request</span>
        </div>

        <div className="animate-fade-up delay-100 mb-6">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#D9EEF7', marginBottom: 10, lineHeight: 1.1 }}>
            We're here.<br />Tell us what's happening.
          </h1>
          <p style={{ color: '#6DA8C4', fontSize: 15, lineHeight: 1.65 }}>Fill this out and Mats will be dispatched as fast as possible. Your arrival window is calculated in real time.</p>
        </div>

        <div className="animate-fade-up delay-200 mb-8 p-5 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#F59E0B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>⚠ Safety first</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Turn off the main water stop valve if possible', 'Stay away from electrical outlets near the water', 'Move valuables away from the affected area'].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: '#F59E0B', fontSize: 12, marginTop: 2 }}>→</span>
                <span style={{ fontSize: 13, color: '#A09060', lineHeight: 1.5 }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-up delay-300">
          {[
            { key: 'name', label: 'Your name', placeholder: 'Anna Lindström', type: 'text', required: true },
            { key: 'phone', label: 'Phone number', placeholder: '+46 73 456 78 90', type: 'tel', required: true },
            { key: 'email', label: 'Email (optional)', placeholder: 'anna@example.com', type: 'email', required: false },
          ].map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                {field.label} {field.required && <span style={{ color: '#E53935' }}>*</span>}
              </label>
              <input
                type={field.type}
                required={field.required}
                className="vvs-input"
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              />
            </div>
          ))}

          {/* Location picker — same as standard booking */}
          <LocationPicker
            value={loc}
            onChange={(v) => setLoc(v)}
          />

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              What is happening? <span style={{ color: '#E53935' }}>*</span>
            </label>
            <textarea
              required
              className="vvs-input"
              style={{ minHeight: 100, resize: 'vertical' }}
              placeholder="e.g. Water is spraying from the pipe under the kitchen sink. Already shut off the water."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              maxLength={1500}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Photo (optional — helps Mats prepare)
            </label>
            <label className="w-full p-5 rounded-xl flex flex-col items-center gap-2 cursor-pointer" style={{ border: '2px dashed rgba(229,57,53,0.2)', color: '#6DA8C4', fontSize: 13 }}>
              <span style={{ fontSize: 22 }}>📷</span>
              <span>{photo ? `Photo added: ${photo.name}` : 'Tap to upload photo'}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {error && <p style={{ fontSize: 13, color: '#EF5350' }}>{error}</p>}

          <div className="sticky-bar">
            <button type="submit" disabled={loading || !ok} className="btn-emergency w-full py-5 rounded-xl text-lg font-bold" style={{ letterSpacing: '0.01em', opacity: loading || !ok ? 0.6 : 1 }}>
              {loading ? 'Checking current availability…' : 'Find emergency availability →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
