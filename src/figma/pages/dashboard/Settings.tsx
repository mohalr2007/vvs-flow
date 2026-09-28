import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme, type ThemeTokens } from '@/figma/context/DashTheme';
import { ownerService } from '@/lib/services';
import { searchAddress, locatePin } from '@/lib/location.functions';
import type { Settings } from '@/lib/vvs-data';

const ALL_DAYS: { label: string; value: number }[] = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 }, { label: 'Sun', value: 0 },
];

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');
const hourStr = (h: number) => `${String(h).padStart(2, '0')}:00`;
const parseHour = (s: string) => Number(s.split(':')[0]) || 0;

type Place = { address: string; lat: number | null; lng: number | null };

// Address search + geocode for the owner's home / custom day endpoints (Nominatim, server-side).
function PlaceSearchField({ label, hint, value, T, onPick }: {
  label: string; hint: string; T: ThemeTokens; value: Place;
  onPick: (p: Place) => void;
}) {
  const [q, setQ] = useState(value.address);
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [open, setOpen] = useState(false);
  const [meta, setMeta] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setQ(value.address), [value.address]);

  const onType = (text: string) => {
    setQ(text);
    // Typing invalidates the stored coordinates until a result is picked (same rule as LocationPicker).
    if (text !== value.address) onPick({ address: text, lat: null, lng: null });
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 3) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const { results: r } = await searchAddress({ data: { query: text } });
        setResults(r); setOpen(r.length > 0);
      } catch { setResults([]); setOpen(false); }
      finally { setBusy(false); }
    }, 350);
  };

  const pick = async (r: { label: string; lat: number; lng: number }) => {
    setQ(r.label); setOpen(false); setResults([]);
    onPick({ address: r.label, lat: r.lat, lng: r.lng });
    try {
      const info = await locatePin({ data: { lat: r.lat, lng: r.lng } });
      setMeta(info.driveMinutes != null ? `~${info.driveMinutes} min drive from Västerås centre` : `${info.distanceKm} km from Västerås centre`);
    } catch { setMeta(null); }
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          className="vvs-input"
          value={q}
          placeholder="Search address…"
          onChange={e => onType(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ background: T.input }}
        />
        {busy && <span style={{ position: 'absolute', right: 12, top: 10, fontSize: 11, color: T.textMid }}>…</span>}
        {open && (
          <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, top: 'calc(100% + 4px)', background: T.card, border: `1px solid ${T.cardBorderStrong}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.35)' }}>
            {results.map(r => (
              <button
                key={`${r.lat},${r.lng}`}
                type="button"
                onMouseDown={e => { e.preventDefault(); void pick(r); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', fontSize: 12.5, color: T.text, background: 'transparent', border: 'none', borderBottom: `1px solid ${T.cardBorder}`, cursor: 'pointer' }}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <p style={{ fontSize: 11.5, color: T.textMid, marginTop: 5 }}>
        {value.lat != null && value.lng != null
          ? meta ?? 'Location saved — coordinates stored.'
          : hint}
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const { tokens: T } = useDashTheme();
  const get = useServerFn(ownerService.settings);
  const q = useQuery({ queryKey: ['settings'], queryFn: () => get() });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>Business configuration — this drives all client-facing slot availability.</p>
        </div>

        {q.isPending ? (
          <p style={{ fontSize: 13, color: T.textMid }}>Loading settings…</p>
        ) : q.isError || !q.data ? (
          <div>
            <p style={{ fontSize: 13, color: '#E53935' }}>{q.error instanceof Error ? q.error.message : 'Settings could not be loaded.'}</p>
            <button onClick={() => q.refetch()} className="btn-water mt-3 px-4 py-2 rounded-lg text-sm">Try again</button>
          </div>
        ) : (
          <SettingsForm s={q.data} />
        )}
      </div>
    </DashboardLayout>
  );
}

function SettingsForm({ s }: { s: Settings }) {
  const { tokens: T } = useDashTheme();
  const save = useServerFn(ownerService.saveSettings);
  const reset = useServerFn(ownerService.reset);
  const clearAll = useServerFn(ownerService.clearAppointments);
  const advance = useServerFn(ownerService.advance);
  const qc = useQueryClient();
  const [f, setF] = useState(s);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => setF(s), [s]);

  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) } as Settings);
  const toggleRestDay = (day: number) => {
    setF(cur => ({ ...cur, rest_days: cur.rest_days.includes(day) ? cur.rest_days.filter(d => d !== day) : [...cur.rest_days, day] }));
  };
  const needsHome = (f.day_start_mode === 'home' || f.day_end_mode === 'home') && (f.home_lat == null || f.home_lng == null);
  const needsCustom = (f.day_start_mode === 'custom' || f.day_end_mode === 'custom') && (f.custom_lat == null || f.custom_lng == null);
  const routeWarning = needsHome
    ? 'Pick a home location below before using it as a start or end point.'
    : needsCustom
      ? 'Pick a custom location below before using it as a start or end point.'
      : null;

  const handleSave = async () => {
    setBusy(true);
    try {
      const { id: _i, clock_offset_minutes: _c, ...rest } = f;
      await save({ data: rest });
      await qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      toast.success('Settings saved');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const runDemo = async (label: string, fn: () => Promise<unknown>) => {
    setDemoBusy(label);
    try { await fn(); await qc.invalidateQueries(); toast.success(`${label} done`); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setDemoBusy(''); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Business */}
      <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 16, fontWeight: 400 }}>Business</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Business name</label>
            <input className="vvs-input" value={f.business_name} onChange={e => setF({ ...f, business_name: e.target.value })} style={{ background: T.input }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Owner name</label>
            <input className="vvs-input" value={f.owner_name} onChange={e => setF({ ...f, owner_name: e.target.value })} style={{ background: T.input }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Service area</label>
            <input className="vvs-input" value={f.service_area} onChange={e => setF({ ...f, service_area: e.target.value })} style={{ background: T.input }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Hourly rate (SEK)</label>
            <input type="number" className="vvs-input" value={f.hourly_rate} onChange={num('hourly_rate')} style={{ background: T.input }} />
          </div>
        </div>
      </div>

      {/* Hours */}
      <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 16, fontWeight: 400 }}>Working hours</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Work day starts</label>
            <input type="time" className="vvs-input" value={hourStr(f.work_start_hour)} onChange={e => setF({ ...f, work_start_hour: parseHour(e.target.value) })} style={{ background: T.input }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Work day ends</label>
            <input type="time" className="vvs-input" value={hourStr(f.work_end_hour)} onChange={e => setF({ ...f, work_end_hour: parseHour(e.target.value) })} style={{ background: T.input }} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            Emergency buffer (min before/after)
          </label>
          <input type="number" className="vvs-input" value={f.emergency_buffer_min} onChange={num('emergency_buffer_min')} style={{ background: T.input }} />
        </div>
      </div>

      {/* Rest days */}
      <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 6, fontWeight: 400 }}>Rest days</h3>
        <p style={{ fontSize: 13, color: T.textMid, marginBottom: 16 }}>No slots will be shown on rest days.</p>
        <div className="flex gap-2 flex-wrap">
          {ALL_DAYS.map(day => {
            const on = f.rest_days.includes(day.value);
            return (
              <button
                key={day.value}
                onClick={() => toggleRestDay(day.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: on ? 'rgba(229,57,53,0.12)' : T.input,
                  color: on ? '#E53935' : T.textMid,
                  border: `1px solid ${on ? 'rgba(229,57,53,0.3)' : T.cardBorder}`,
                  cursor: 'pointer',
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Route & day planning */}
      <div className="p-6 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 17, color: T.text, marginBottom: 6, fontWeight: 400 }}>Route &amp; day planning</h3>
        <p style={{ fontSize: 13, color: T.textMid, marginBottom: 16 }}>
          Where the driving day starts and ends, and the minimum driving slack around each job.
          Customers are only offered times the route can actually reach.
        </p>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Day starts at</label>
              <select className="vvs-input" value={f.day_start_mode} onChange={e => setF({ ...f, day_start_mode: e.target.value as Settings['day_start_mode'] })} style={{ background: T.input }}>
                <option value="business">Business location</option>
                <option value="home">Home</option>
                <option value="custom">Custom point</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Day ends at</label>
              <select className="vvs-input" value={f.day_end_mode} onChange={e => setF({ ...f, day_end_mode: e.target.value as Settings['day_end_mode'] })} style={{ background: T.input }}>
                <option value="none">No end point</option>
                <option value="business">Business location</option>
                <option value="home">Home</option>
                <option value="custom">Custom point</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              Route buffer (min between jobs)
            </label>
            <input type="number" min={0} max={120} className="vvs-input" value={f.route_buffer_min} onChange={num('route_buffer_min')} style={{ background: T.input }} />
            <p style={{ fontSize: 11.5, color: T.textMid, marginTop: 5 }}>Free minutes kept around every appointment for parking, unpacking and delays.</p>
          </div>
          <PlaceSearchField
            label="Home location"
            hint="Search where Mats starts the day when “Day starts/ends at” is Home."
            T={T}
            value={{ address: f.home_address, lat: f.home_lat, lng: f.home_lng }}
            onPick={p => setF({ ...f, home_address: p.address, home_lat: p.lat, home_lng: p.lng })}
          />
          <PlaceSearchField
            label="Custom location"
            hint="Search a custom start/end point (e.g. a depot or storage)."
            T={T}
            value={{ address: f.custom_address, lat: f.custom_lat, lng: f.custom_lng }}
            onPick={p => setF({ ...f, custom_address: p.address, custom_lat: p.lat, custom_lng: p.lng })}
          />
          {routeWarning && (
            <p style={{ fontSize: 12, color: '#E53935' }}>{routeWarning}</p>
          )}
        </div>
      </div>

      {/* Demo controls */}
      <div className="p-4 rounded-xl" style={{ background: T.input, border: `1px dashed ${T.cardBorderStrong}` }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Demo mode active
        </div>
        <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5, marginBottom: 12 }}>
          Simulated clock and data — separate from real business actions.{f.clock_offset_minutes !== 0 ? ` Demo clock is ${Math.round(f.clock_offset_minutes / 60)}h ahead of real time.` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { if (confirm('Reset all demo data?')) void runDemo('Reset', () => reset()); }}
            disabled={!!demoBusy}
            className="px-3 py-2 rounded-lg text-xs"
            style={{ background: T.cardAlt, color: T.textMid, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', opacity: demoBusy ? 0.6 : 1 }}
          >
            {demoBusy === 'Reset' ? 'Resetting…' : '↺ Reset Demo'}
          </button>
          <button
            onClick={() => { if (confirm('Delete ALL appointments and empty the calendar? This cannot be undone.')) void runDemo('Clear appointments', () => clearAll()); }}
            disabled={!!demoBusy}
            className="px-3 py-2 rounded-lg text-xs"
            style={{ background: 'rgba(229,57,53,0.12)', color: '#E53935', border: '1px solid rgba(229,57,53,0.3)', cursor: 'pointer', opacity: demoBusy ? 0.6 : 1 }}
          >
            {demoBusy === 'Clear appointments' ? 'Clearing…' : '🗑 Clear all appointments'}
          </button>
          <button
            onClick={() => void runDemo('Advance 15 min', () => advance({ data: { minutes: 15 } }))}
            disabled={!!demoBusy}
            className="px-3 py-2 rounded-lg text-xs"
            style={{ background: T.cardAlt, color: T.textMid, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', opacity: demoBusy ? 0.6 : 1 }}
          >
            {demoBusy === 'Advance 15 min' ? 'Advancing…' : 'Advance 15 min'}
          </button>
          <button
            onClick={() => void runDemo('Advance 24 hours', () => advance({ data: { minutes: 1440 } }))}
            disabled={!!demoBusy}
            className="px-3 py-2 rounded-lg text-xs"
            style={{ background: T.cardAlt, color: T.textMid, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', opacity: demoBusy ? 0.6 : 1 }}
          >
            {demoBusy === 'Advance 24 hours' ? 'Advancing…' : 'Advance 24 hours'}
          </button>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={busy || f.rest_days.length > 6 || f.work_end_hour <= f.work_start_hour || !!routeWarning}
        className="btn-copper py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
        style={{ opacity: busy ? 0.7 : 1 }}
      >
        {busy ? 'Saving…' : saved ? '✓ Changes saved' : 'Save changes'}
      </button>
    </div>
  );
}
