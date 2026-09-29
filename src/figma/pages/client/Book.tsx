import { Wrench, Hammer } from 'lucide-react';
import { downloadIcs } from '@/lib/ics';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from '@/figma/router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import ClientNav from '@/figma/components/ClientNav';
import { bookingService } from '@/lib/services';
import { LocationPicker, type PickedLocation } from '@/figma/components/LocationPicker';
import { uploadPhoto } from '@/lib/upload';
import type { SlotGroup } from '@/lib/vvs-data';
import { ACCESS_OPTIONS } from '@/lib/vvs-data';
import { fmtDay, fmtRange, fmtTime, sek } from '@/lib/time';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

// Steps: 1=Service, 2=Details, 3=Location, 4=Time(optional), 5=Access, 6=Confirm, 'done'
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 'done';

const W = '#0891B2';
const WL = '#22D3EE';

type Ai = { title: string; summary: string; urgency: 'Low' | 'Normal' | 'High' | 'Emergency'; duration_min: number; price_low: number; price_high: number; confidence: number; needs_site_visit: boolean; location_hint: string | null; missing_fields: string[] };
type Done = Awaited<ReturnType<typeof bookingService.create>> | { type: 'waitlist'; ref: string; accessToken: null; scheduledAt: null; eta: null };

const EMPTY_LOC: PickedLocation = { address: '', lat: null, lng: null, inside: null, driveMinutes: null };

const ACCESS_ICONS: Record<string, string> = {
  "Yes, I'll be home": '🏠',
  'Key with neighbor': '🔑',
  'Door code available': '🚪',
  'I need to arrange access': '✏️',
};
const ACCESS_DESCS: Record<string, string> = {
  "Yes, I'll be home": 'Someone will let Mats in on arrival.',
  'Key with neighbor': "I'll leave a key with a neighbor.",
  'Door code available': "I'll share the door code.",
  'I need to arrange access': "I'll describe the access in a note.",
};

function StepProgress({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center w-full max-w-lg mx-auto">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === current;
        const done = num < current;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-400"
                style={{
                  background: done ? W : active ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.04)',
                  border: active ? `2px solid ${W}` : done ? `2px solid ${W}` : '2px solid rgba(8,145,178,0.15)',
                  color: done ? '#030E1C' : active ? W : '#2E5B75',
                  fontFamily: 'JetBrains Mono',
                  boxShadow: active ? `0 0 12px rgba(8,145,178,0.4)` : 'none',
                }}>
                {done ? '✓' : num}
              </div>
              <span className="mt-1 text-center hidden sm:block"
                style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: active ? WL : '#2E5B75', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-1 transition-all duration-500"
                style={{ background: done ? `linear-gradient(90deg, ${W}, ${WL})` : 'rgba(8,145,178,0.1)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Book() {
  const navigate = useNavigate();
  const understand = useServerFn(bookingService.understand), getSlots = useServerFn(bookingService.slots), create = useServerFn(bookingService.create);
  const joinWaitlistFn = useServerFn(bookingService.joinWaitlist);
  const [step, setStep] = useState<Step>(1);
  const [jobType, setJobType] = useState<'repair' | 'install' | null>(null);
  const [leaking, setLeaking] = useState<boolean | null>(null);
  const [description, setDescription] = useState('');
  const [ai, setAi] = useState<Ai | null>(null);
  const [aiError, setAiError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [loc, setLoc] = useState<PickedLocation>(EMPTY_LOC);
  const [photo, setPhoto] = useState<File | null>(null);
  const [groups, setGroups] = useState<SlotGroup[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState('');
  const [slotsNote, setSlotsNote] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [accessChoice, setAccessChoice] = useState<string | null>(null);
  const [noTime, setNoTime] = useState(false);

  const isProject = jobType === 'install';
  const lowConfidence = !!ai && ai.confidence < 60 && !isProject;
  const manual = !ai && !!aiError;
  const skipTime = isProject || lowConfidence || manual;

  // Access is now collected inline with the customer details (step 3).
  const steps = skipTime
    ? ['Service', 'Details', 'Location', 'Confirm']
    : ['Service', 'Details', 'Location', 'Time', 'Confirm'];

  // Logical step numbers (1-indexed)
  const timeStep = skipTime ? null : 4;          // step 4 (skipped when skipTime)
  const confirmStep = skipTime ? 4 : 5;          // last step

  const stepIndex = typeof step === 'number' ? step : confirmStep;

  // Fully reset form when switching job type so stale state never persists
  const changeJobType = (type: 'repair' | 'install') => {
    setJobType(type);
    setLeaking(null);
    setAi(null);
    setAiError('');
    setDescription('');
    setForm({ name: '', address: '', phone: '', email: '' });
    setLoc(EMPTY_LOC);
    setPhoto(null);
    setGroups(null);
    setSelectedSlot(null);
    setSlotsError('');
    setSlotsNote('');
    setSubmitError('');
    setAccessChoice(null);
    setNoTime(false);
  };

  // Reset all state on mount so visiting the page never keeps old form data
  useEffect(() => {
    changeJobType('repair');
    setJobType(null);
    setDone(null);
    setBusy(false);
    setStep(1);
  }, []);

  async function runAi() {
    setAnalyzing(true); setAi(null); setAiError('');
    try {
      const r = await understand({ data: { message: description, kind: isProject ? 'project' : 'repair' } });
      if ('data' in r) setAi(r.data); else setAiError(r.error);
    } catch (e) { setAiError(errMsg(e)); } finally { setAnalyzing(false); }
  }

  async function loadSlots() {
    setGroups(null); setSelectedSlot(null); setSlotsError(''); setSlotsNote('');
    try {
      const r = await getSlots({ data: { duration: ai?.duration_min ?? 60, address: form.address, lat: loc.lat, lng: loc.lng } });
      if (r.outsideArea) setSlotsNote("This address is outside our service area. Go back and change the address.");
      else if (r.routeUnavailable) setSlotsNote("We couldn't estimate the drive to your address right now. Try again in a moment, or go back and continue without a time.");
      setGroups(r.groups);
    }
    catch (e) { setSlotsError(errMsg(e)); setGroups([]); }
  }

  async function submit() {
    setBusy(true); setSubmitError('');
    try {
      const photoPath = photo ? await uploadPhoto(photo) : null;
      const r = await create({
        data: {
          kind: isProject ? 'project' : 'repair', ...form, address: loc.address || form.address, description,
          title: ai?.title ?? null, urgency: ai?.urgency ?? null, duration_min: ai?.duration_min ?? null,
          price_high: ai?.price_high ?? null, confidence: ai?.confidence ?? null, missing_fields: ai?.missing_fields ?? null,
          slotStart: skipTime || noTime ? null : selectedSlot, photoPath, lat: loc.lat, lng: loc.lng,
          accessChoice: accessChoice ?? null,
        },
      });
      setDone(r); setStep('done');
    } catch (e) {
      setSubmitError(errMsg(e));
      toast.error(errMsg(e));
      // Go back to time step on failure so user can pick another slot
      if (!skipTime && !noTime) { setStep(timeStep as Step); void loadSlots(); }
    } finally { setBusy(false); }
  }

  const goNext = async () => {
    if (typeof step !== 'number') return;
    if (step === 1 && leaking) { navigate('/emergency'); return; }
    if (step === 2 && !ai && !manual) {
      if (description.trim().length >= 8) {
        setAnalyzing(true);
        try {
          const r = await understand({ data: { message: description, kind: isProject ? 'project' : 'repair' } });
          if ('data' in r) setAi(r.data); else setAiError(r.error);
        } catch (e) {
          setAiError(errMsg(e));
        } finally {
          setAnalyzing(false);
        }
      }
      setStep(3);
      return;
    }
    // Leaving Location step: load slots if not skipping time
    if (step === 3 && !skipTime) void loadSlots();
    // On confirm step: submit
    if (step === confirmStep) { void submit(); return; }
    setStep(((step as number) + 1) as Step);
  };

  const goBack = () => setStep(s => (typeof s === 'number' && s > 1 ? (s - 1) as Step : s));

  const groupedEntries = groups ? groups.map(g => ({
    day: g.day,
    morning: g.slots.filter(s => Number(fmtTime(s.start).slice(0, 2)) < 12),
    afternoon: g.slots.filter(s => { const h = Number(fmtTime(s.start).slice(0, 2)); return h >= 12 && h < 15; }),
    evening: g.slots.filter(s => Number(fmtTime(s.start).slice(0, 2)) >= 15),
  })) : [];

  // ── Waitlist Done screen ────────────────────────────────────
  if (step === 'done' && done && done.type === 'waitlist') {
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
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>
              As soon as a slot opens near you, you'll get a priority offer by email — valid 15 minutes.
            </p>
            <div style={{ background: 'rgba(7,26,46,0.75)', border: '1px solid rgba(123,97,255,0.2)', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#7B61FF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
              {[
                { icon: '1', text: 'Another customer cancels their appointment.' },
                { icon: '2', text: 'Our system finds the best match from the waitlist — that could be you.' },
                { icon: '3', text: 'You receive a private link valid for 15 minutes to confirm the slot.' },
                { icon: '4', text: 'One click — the slot is yours. No phone call needed.' },
              ].map(s => (
                <div key={s.icon} className="flex items-start gap-3 mb-3">
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#7B61FF' }}>{s.icon}</div>
                  <span style={{ fontSize: 13, color: '#6DA8C4', lineHeight: 1.5 }}>{s.text}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full btn-ghost py-3 rounded-xl text-sm font-semibold"
              onClick={() => { setDone(null); setStep(1); changeJobType('repair'); setJobType(null); }}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular Done screen ─────────────────────────────────────
  if (step === 'done' && done) {
    const booked = done.type === 'booked' && done.scheduledAt;
    const duration = ai?.duration_min ?? 60;
    return (
      <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
        <ClientNav />
        <div className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-md w-full text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
              <span style={{ fontSize: 36 }}>✓</span>
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>
              {booked ? "You're booked." : 'Booking received.'}
            </h1>
            <p style={{ color: '#6DA8C4', marginBottom: 24 }}>
              {booked ? `${fmtDay(done.scheduledAt!)} · ${fmtRange(done.scheduledAt!, duration)}`
                : done.type === 'project' ? 'Mats will contact you to plan a site visit.'
                : 'Mats will review your request and contact you personally.'}
            </p>
            <div style={{ background: 'rgba(7,26,46,0.75)', border: `1px solid rgba(8,145,178,0.15)`, borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
              <div className="flex justify-between items-center mb-4">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6DA8C4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Reference</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: WL }}>{done.ref}</span>
              </div>
              {[
                { label: 'Service', value: ai?.title ?? (isProject ? 'Project request' : 'Repair / Emergency') },
                ...(booked ? [{ label: 'Time', value: `${fmtDay(done.scheduledAt!)} · ${fmtRange(done.scheduledAt!, duration)}` }] : []),
                { label: 'Address', value: form.address || 'Provided' },
                ...(accessChoice ? [{ label: 'Access method', value: accessChoice }] : []),
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(8,145,178,0.07)' }}>
                  <span style={{ fontSize: 13, color: '#6DA8C4' }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: '#D9EEF7' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {done.accessToken && <Link to={`/access/${done.accessToken}`} className="flex-1 min-w-[130px] btn-water no-underline inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold">View booking</Link>}
              {booked && <button className="flex-1 min-w-[130px] btn-ghost py-3 rounded-xl text-sm font-semibold" onClick={() => downloadIcs({ title: `Ekström VVS — ${ai?.title ?? 'Plumbing visit'}`, start: done.scheduledAt!, minutes: duration, location: form.address || loc.address })}>Add to calendar</button>}
              <button
                type="button"
                className="flex-1 min-w-[130px] btn-ghost py-3 rounded-xl text-sm font-semibold"
                onClick={() => {
                  setDone(null);
                  setStep(1);
                  changeJobType('repair');
                  setJobType(null);
                }}
              >
                New booking +
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
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-32">
        <div className="mb-12 animate-fade-up">
          <StepProgress current={stepIndex} steps={steps} />
        </div>

        {/* ── Step 1: Service type ─────────────────────────── */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>What do you need?</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 32, fontSize: 15 }}>Choose the type of service.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { id: 'repair', title: 'Repair / Emergency', desc: 'Something is broken, leaking, or not working.', icon: <Wrench size={28} color="#22D3EE" strokeWidth={1.6} /> },
                { id: 'install', title: 'New Installation', desc: 'A new fixture, appliance, or full renovation.', icon: <Hammer size={28} color="#22D3EE" strokeWidth={1.6} /> },
              ].map(opt => (
                <button key={opt.id} onClick={() => changeJobType(opt.id as 'repair' | 'install')}
                  className="text-left p-6 rounded-xl transition-all duration-200"
                  style={{
                    background: jobType === opt.id ? 'rgba(8,145,178,0.1)' : 'rgba(7,26,46,0.75)',
                    border: `1px solid ${jobType === opt.id ? W : 'rgba(8,145,178,0.12)'}`,
                    boxShadow: jobType === opt.id ? `0 0 0 3px rgba(8,145,178,0.15)` : 'none',
                    cursor: 'pointer',
                  }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{opt.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#D9EEF7', marginBottom: 6 }}>{opt.title}</div>
                  <div style={{ fontSize: 13, color: '#6DA8C4', lineHeight: 1.5 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
            {jobType === 'repair' && (
              <div className="animate-slide-up p-5 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#D9EEF7', marginBottom: 12 }}>Is water actively leaking right now?</p>
                <div className="flex gap-3">
                  <Link to="/emergency" className="btn-emergency no-underline flex-1 text-center py-3 rounded-lg text-sm font-semibold">Yes — emergency</Link>
                  <button onClick={() => setLeaking(false)} className="flex-1 py-3 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: leaking === false ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${leaking === false ? W : 'rgba(255,255,255,0.1)'}`, color: leaking === false ? WL : '#D9EEF7', cursor: 'pointer' }}>
                    No, it can wait
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Describe ─────────────────────────────── */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>{isProject ? 'Tell us about your project' : 'Describe the problem'}</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>Use your own words — no technical knowledge needed.</p>
            <textarea className="vvs-input" style={{ minHeight: 140, resize: 'vertical' }}
              placeholder={isProject ? 'We want to renovate our bathroom and add floor heating.' : "e.g. The hot water in my bathroom stopped working yesterday. The boiler clicks but doesn't ignite…"}
              value={description} onChange={e => { setDescription(e.target.value); setAi(null); setAiError(''); }} maxLength={1500} />
            <button onClick={runAi} disabled={description.trim().length < 8 || analyzing}
              className="btn-water w-full py-3 rounded-xl mt-4 flex items-center justify-center gap-2 text-sm font-semibold"
              style={{ opacity: description.trim().length < 8 ? 0.4 : 1 }}>
              {analyzing ? <><span style={{ display: 'inline-block', animation: 'ticker 0.8s linear infinite' }}>⟳</span> Analysing…</> : 'Understand request →'}
            </button>
            {aiError && (
              <div className="animate-slide-up mt-6 p-5 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#D9EEF7' }}>⚠ {aiError}</p>
                <p style={{ fontSize: 12, color: '#6DA8C4', marginTop: 4 }}>You can continue — Mats will review your request personally.</p>
              </div>
            )}
            {ai && (
              <div className="animate-slide-up mt-6 p-5 rounded-xl" style={{ background: 'rgba(7,26,46,0.75)', border: `1px solid rgba(8,145,178,0.2)` }}>
                <div className="flex items-center gap-2 mb-4">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: W, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI understanding</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(8,145,178,0.2)' }} />
                  <span className="tag" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>{ai.confidence}% confidence</span>
                </div>
                {[
                  { label: 'Type', value: ai.title },
                  { label: 'Urgency', value: ai.urgency },
                  { label: 'Est. duration', value: isProject || lowConfidence ? 'Site visit' : `${ai.duration_min} min` },
                  { label: 'Price range', value: ai.price_high ? `${sek(ai.price_low)} – ${sek(ai.price_high)}` : 'After assessment' },
                  ...(ai.missing_fields.length ? [{ label: 'Missing info', value: ai.missing_fields.join(' · ') }] : []),
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(8,145,178,0.07)' }}>
                    <span style={{ fontSize: 13, color: '#6DA8C4' }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: '#D9EEF7', fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
                {lowConfidence && <p style={{ marginTop: 12, fontSize: 13, color: '#F59E0B' }}>This request needs a quick assessment. Mats will contact you to agree on the right time.</p>}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Contact & Location ───────────────────── */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Your details</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>So Mats knows where to go and how to reach you.</p>
            <div className="flex flex-col gap-4">
              {[
                { key: 'name', label: 'Full name', placeholder: 'Anna Lindström', type: 'text' },
                { key: 'phone', label: 'Phone number', placeholder: '+46 73 456 78 90', type: 'tel' },
                { key: 'email', label: 'Email (optional)', placeholder: 'anna@example.com', type: 'email' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{field.label}</label>
                  <input type={field.type} className="vvs-input" placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
                </div>
              ))}
              <LocationPicker value={loc} onChange={(v) => { setLoc(v); setForm(f => ({ ...f, address: v.address })); setSelectedSlot(null); setGroups(null); }} />
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Photo (optional)</label>
                <label className="w-full p-6 rounded-xl flex flex-col items-center gap-2 cursor-pointer"
                  style={{ border: `2px dashed rgba(8,145,178,0.2)`, color: '#6DA8C4', fontSize: 13 }}>
                  <span style={{ fontSize: 24 }}>📷</span>
                  <span>{photo ? `Photo added: ${photo.name}` : 'Tap to upload a photo of the issue'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              {/* Access method — collected together with the customer details */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>How will Mats get in?</label>
                <div className="grid grid-cols-2 gap-3">
                  {ACCESS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAccessChoice(opt)}
                      className="text-left p-4 rounded-xl transition-all duration-200"
                      style={{
                        background: accessChoice === opt ? 'rgba(8,145,178,0.1)' : 'rgba(7,26,46,0.75)',
                        border: `1px solid ${accessChoice === opt ? W : 'rgba(8,145,178,0.12)'}`,
                        boxShadow: accessChoice === opt ? `0 0 0 3px rgba(8,145,178,0.15)` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{ACCESS_ICONS[opt]}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#D9EEF7', marginBottom: 4 }}>{opt}</div>
                      <div style={{ fontSize: 11, color: '#6DA8C4', lineHeight: 1.4 }}>{ACCESS_DESCS[opt]}</div>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#2E5B75', marginTop: 8 }}>Optional — you can change this later from your booking link.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Pick a time (only when !skipTime) ────── */}
        {step === 4 && !skipTime && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Pick a time</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>The best times for your address, based on Mats's route that day.</p>
            {groups === null ? (
              <div className="flex flex-col gap-3">{[0, 1].map(i => <div key={i} style={{ height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} className="animate-pulse" />)}</div>
            ) : groups.length === 0 && slotsNote ? (
              <div>
                <p style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: '#6DA8C4' }}>{slotsNote}</p>
                <button onClick={() => void loadSlots()} className="btn-ghost mt-3 px-4 py-2 rounded-lg text-sm">Try again</button>
              </div>
            ) : groups.length === 0 ? (
              <div className="animate-fade-up">
                <div style={{ padding: '20px 16px', borderRadius: 16, background: 'rgba(123,97,255,0.05)', border: '1px solid rgba(123,97,255,0.15)', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#7B61FF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Agenda complet</div>
                  <p style={{ fontSize: 13, color: '#6DA8C4', marginBottom: 0, lineHeight: 1.5 }}>
                    No slots available in the next days. Join the <strong style={{ color: '#D9EEF7' }}>Priority Waitlist</strong> — you'll receive an exclusive 15-minute offer by email the moment a cancellation opens up near you.
                  </p>
                </div>
                {!form.email ? (
                  <p style={{ fontSize: 12, color: '#4A8BAA', marginBottom: 12 }}>← Go back and fill in your email to use the waitlist.</p>
                ) : (
                  <button
                    onClick={async () => {
                      setJoiningWaitlist(true);
                      try {
                        await joinWaitlistFn({ data: { name: form.name, phone: form.phone || undefined, email: form.email, address: form.address, title: ai?.title, duration_min: ai?.duration_min, urgency: ai?.urgency, flexibility: 'Flexible', lat: loc.lat ?? undefined, lng: loc.lng ?? undefined } });
                        setDone({ type: 'waitlist', ref: 'WL-' + Math.random().toString(36).slice(2, 8).toUpperCase(), accessToken: null, scheduledAt: null, eta: null });
                        setStep('done');
                      } catch (e) {
                        setSubmitError(e instanceof Error ? e.message : 'Could not join waitlist');
                      } finally {
                        setJoiningWaitlist(false);
                      }
                    }}
                    disabled={joiningWaitlist}
                    className="w-full py-4 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: 'rgba(123,97,255,0.12)', color: '#7B61FF', border: '1px solid rgba(123,97,255,0.3)', cursor: joiningWaitlist ? 'not-allowed' : 'pointer', opacity: joiningWaitlist ? 0.7 : 1 }}
                  >
                    {joiningWaitlist ? 'Registering…' : '⏳ Join Priority Waitlist →'}
                  </button>
                )}
              </div>
            ) : groupedEntries.map(g => (
              <div key={g.day} className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: W, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{fmtDay(g.day)}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(8,145,178,0.1)' }} />
                </div>
                {[['Morning', g.morning], ['Afternoon', g.afternoon], ['Late afternoon & evening', g.evening]].map(([label, list]) =>
                  (list as { start: string; travel: string; recommended?: boolean }[]).length === 0 ? null : (
                    <div key={label as string} className="mb-4">
                      <p style={{ fontSize: 11, color: '#6DA8C4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label as string}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(list as { start: string; travel: string; recommended?: boolean }[]).map(slot => (
                          <button key={slot.start} onClick={() => setSelectedSlot(slot.start)} className={`slot-card text-left ${selectedSlot === slot.start ? 'selected' : ''}`}>
                            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 500, color: '#D9EEF7' }}>{fmtTime(slot.start)}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: slot.recommended ? '#E8A06A' : '#22D3EE' }}>{slot.recommended ? 'Recommended' : 'Available'}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#6DA8C4' }}>{slot.travel}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
            {slotsError && <p style={{ marginTop: 12, fontSize: 13, color: '#EF5350' }}>{slotsError}</p>}
          </div>
        )}


        {/* ── Step confirmStep: Review & confirm ──────────── */}
        {step === confirmStep && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Review & confirm</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>Nothing is confirmed until you press the button below.</p>
            <div style={{ background: 'rgba(7,26,46,0.75)', border: `1px solid rgba(8,145,178,0.12)`, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
              {[
                { label: 'Service', value: ai?.title ?? (isProject ? 'Project request' : 'Repair / Emergency') },
                { label: 'Client', value: form.name || '—' },
                { label: 'Address', value: form.address || '—' },
                { label: 'Phone', value: form.phone || '—' },
                { label: 'Time', value: skipTime || noTime || !selectedSlot ? (isProject ? "We'll contact you" : "We'll contact you to agree a time") : `${fmtDay(selectedSlot)} · ${fmtRange(selectedSlot, ai?.duration_min ?? 60)}` },
                { label: 'Access', value: accessChoice ?? 'Not specified' },
                { label: 'Estimate', value: ai && ai.price_high ? `${sek(ai.price_low)} – ${sek(ai.price_high)}` : isProject ? 'Site visit free of charge' : 'After assessment' },
              ].map((row, i, arr) => (
                <div key={row.label} className="flex justify-between px-5 py-4" style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(8,145,178,0.07)' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#6DA8C4' }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: '#D9EEF7', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl mb-2" style={{ background: 'rgba(184,115,51,0.06)', border: '1px solid rgba(184,115,51,0.15)' }}>
              <p style={{ fontSize: 13, color: '#A08060', lineHeight: 1.6 }}>This is an estimate — not a binding quote. Final price depends on what Mats finds on site.</p>
            </div>
            {submitError && <p style={{ fontSize: 13, color: '#EF5350', marginTop: 8 }}>{submitError}</p>}
          </div>
        )}

        {/* ── Bottom navigation bar ───────────────────────── */}
        <div className="sticky-bar">
          <div className="flex gap-3">
            {typeof step === 'number' && step > 1 && (
              <button onClick={goBack} disabled={busy} className="btn-ghost flex-1 py-4 rounded-xl font-semibold">← Back</button>
            )}
            {step === 1 && (
              <button onClick={goNext} disabled={!jobType || (jobType === 'repair' && leaking === null)}
                className="btn-water flex-1 py-4 rounded-xl font-semibold"
                style={{ opacity: !jobType || (jobType === 'repair' && leaking === null) ? 0.4 : 1 }}>
                Continue →
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => void goNext()}
                disabled={description.trim().length < 8 || analyzing}
                className="btn-water flex-1 py-4 rounded-xl font-semibold"
                style={{ opacity: description.trim().length < 8 || analyzing ? 0.4 : 1 }}
              >
                {analyzing ? 'Analysing request…' : 'Continue →'}
              </button>
            )}
            {step === 3 && (() => {
              const detailsBlocked =
                form.name.trim().length < 2 ||
                (form.address.trim().length < 4 && loc.address.trim().length < 4) ||
                form.phone.replace(/\D/g, '').length < 7 ||
                loc.inside === false;
              return (
                <button
                  onClick={() => void goNext()}
                  disabled={detailsBlocked}
                  className="btn-water flex-1 py-4 rounded-xl font-semibold"
                  style={{ opacity: detailsBlocked ? 0.4 : 1 }}
                >
                  Continue →
                </button>
              );
            })()}
            {step === 4 && !skipTime && (
              selectedSlot ? (
                <button onClick={() => { setNoTime(false); void goNext(); }} className="btn-water flex-1 py-4 rounded-xl font-semibold">Continue →</button>
              ) : (
                <button onClick={() => { setNoTime(true); setSelectedSlot(null); void goNext(); }} className="btn-ghost flex-1 py-4 rounded-xl font-semibold">
                  Continue without a time →
                </button>
              )
            )}
            {step === confirmStep && (
              <button onClick={goNext} disabled={busy} className="btn-water flex-1 py-4 rounded-xl font-semibold">
                {busy ? 'Sending…' : skipTime ? 'Send request ✓' : 'Confirm booking ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
