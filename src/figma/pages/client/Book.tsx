import { downloadIcs } from '@/lib/ics';
import { useState } from 'react';
import { Link, useNavigate } from '@/figma/router';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import ClientNav from '@/figma/components/ClientNav';
import { bookingService } from '@/lib/services';
import { uploadPhoto } from '@/lib/upload';
import type { SlotGroup } from '@/lib/vvs-data';
import { fmtDay, fmtRange, fmtTime, sek } from '@/lib/time';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

type Step = 1 | 2 | 3 | 4 | 5 | 'done';

const W = '#0891B2';
const WL = '#22D3EE';

type Ai = { title: string; summary: string; urgency: 'Low' | 'Normal' | 'High' | 'Emergency'; duration_min: number; price_low: number; price_high: number; confidence: number; needs_site_visit: boolean; location_hint: string | null; missing_fields: string[] };
type Done = Awaited<ReturnType<typeof bookingService.create>>;

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
  const [step, setStep] = useState<Step>(1);
  const [jobType, setJobType] = useState<'repair' | 'install' | null>(null);
  const [leaking, setLeaking] = useState<boolean | null>(null);
  const [description, setDescription] = useState('');
  const [ai, setAi] = useState<Ai | null>(null);
  const [aiError, setAiError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' });
  const [photo, setPhoto] = useState<File | null>(null);
  const [groups, setGroups] = useState<SlotGroup[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const isProject = jobType === 'install';
  const lowConfidence = !!ai && ai.confidence < 60 && !isProject;
  const manual = !ai && !!aiError;
  const skipTime = isProject || lowConfidence || manual;
  const steps = skipTime ? ['Service', 'Details', 'Location', 'Confirm'] : ['Service', 'Details', 'Location', 'Time', 'Confirm'];
  const confirmStep = steps.length;

  const stepIndex = typeof step === 'number' ? step : confirmStep;

  async function runAi() {
    setAnalyzing(true); setAi(null); setAiError('');
    try {
      const r = await understand({ data: { message: description, kind: isProject ? 'project' : 'repair' } });
      if ('data' in r) setAi(r.data); else setAiError(r.error);
    } catch (e) { setAiError(errMsg(e)); } finally { setAnalyzing(false); }
  }

  async function loadSlots() {
    setGroups(null); setSelectedSlot(null); setSlotsError('');
    try { setGroups((await getSlots({ data: { duration: ai?.duration_min ?? 60, address: form.address } })).groups); }
    catch (e) { setSlotsError(errMsg(e)); setGroups([]); }
  }

  async function submit() {
    setBusy(true); setSubmitError('');
    try {
      const photoPath = photo ? await uploadPhoto(photo) : null;
      const r = await create({
        data: {
          kind: isProject ? 'project' : 'repair', ...form, description,
          title: ai?.title ?? null, urgency: ai?.urgency ?? null, duration_min: ai?.duration_min ?? null,
          price_high: ai?.price_high ?? null, confidence: ai?.confidence ?? null, missing_fields: ai?.missing_fields ?? null,
          slotStart: skipTime ? null : selectedSlot, photoPath,
        },
      });
      setDone(r); setStep('done');
    } catch (e) {
      setSubmitError(errMsg(e));
      toast.error(errMsg(e));
      if (!skipTime) { setStep(4); void loadSlots(); }
    } finally { setBusy(false); }
  }

  const goNext = () => {
    if (typeof step !== 'number') return;
    if (step === 1 && leaking) { navigate('/emergency'); return; }
    if (step === confirmStep) { void submit(); return; }
    if (step === 3 && !skipTime) void loadSlots();
    if (step === (skipTime ? 3 : 4)) { setStep((skipTime ? 4 : 5) as Step); return; }
    setStep(((step as number) + 1) as Step);
  };
  const goBack = () => setStep(s => (typeof s === 'number' && s > 1 ? (s - 1) as Step : s));

  const groupedEntries = groups ? groups.map(g => ({ day: g.day, morning: g.slots.filter(s => Number(fmtTime(s.start).slice(0, 2)) < 12), afternoon: g.slots.filter(s => { const h = Number(fmtTime(s.start).slice(0, 2)); return h >= 12 && h < 17; }), evening: g.slots.filter(s => Number(fmtTime(s.start).slice(0, 2)) >= 17) })) : [];

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
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>{booked ? "You're booked." : 'Booking received.'}</h1>
            <p style={{ color: '#6DA8C4', marginBottom: 24 }}>{booked ? `${fmtDay(done.scheduledAt!)} · ${fmtRange(done.scheduledAt!, duration)}` : done.type === 'project' ? 'Mats will contact you to plan a site visit.' : 'Mats will review your request and contact you personally.'}</p>
            <div style={{ background: 'rgba(7,26,46,0.75)', border: `1px solid rgba(8,145,178,0.15)`, borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
              <div className="flex justify-between items-center mb-4">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6DA8C4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Reference</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: WL }}>{done.ref}</span>
              </div>
              {[
                { label: 'Service', value: ai?.title ?? (isProject ? 'Project request' : 'Repair / Emergency') },
                ...(booked ? [{ label: 'Time', value: `${fmtDay(done.scheduledAt!)} · ${fmtRange(done.scheduledAt!, duration)}` }] : []),
                { label: 'Address', value: form.address || 'Provided' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(8,145,178,0.07)' }}>
                  <span style={{ fontSize: 13, color: '#6DA8C4' }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: '#D9EEF7' }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              {done.accessToken && <Link to={`/access/${done.accessToken}`} className="flex-1 btn-water no-underline inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold">View booking</Link>}
              {booked && <button className="flex-1 btn-ghost py-3 rounded-xl text-sm font-semibold" onClick={() => downloadIcs({ title: `Ekström VVS — ${ai?.title ?? 'Plumbing visit'}`, start: done.scheduledAt!, minutes: duration, location: form.address })}>Add to calendar</button>}
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

        {step === 1 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>What do you need?</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 32, fontSize: 15 }}>Choose the type of service.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { id: 'repair', title: 'Repair / Emergency', desc: 'Something is broken, leaking, or not working.', icon: <Wrench size={28} color="#22D3EE" strokeWidth={1.6} /> },
                { id: 'install', title: 'New Installation', desc: 'A new fixture, appliance, or full renovation.', icon: <Hammer size={28} color="#22D3EE" strokeWidth={1.6} /> },
              ].map(opt => (
                <button key={opt.id} onClick={() => { setJobType(opt.id as 'repair' | 'install'); setLeaking(null); setAi(null); setAiError(''); }}
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

        {step === 3 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Your details</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>So Mats knows where to go and how to reach you.</p>
            <div className="flex flex-col gap-4">
              {[
                { key: 'name', label: 'Full name', placeholder: 'Anna Lindström', type: 'text' },
                { key: 'address', label: 'Address', placeholder: 'Vasagatan 14, Västerås', type: 'text' },
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
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Photo (optional)</label>
                <label className="w-full p-6 rounded-xl flex flex-col items-center gap-2 cursor-pointer"
                  style={{ border: `2px dashed rgba(8,145,178,0.2)`, color: '#6DA8C4', fontSize: 13 }}>
                  <span style={{ fontSize: 24 }}>📷</span>
                  <span>{photo ? `Photo added: ${photo.name}` : 'Tap to upload a photo of the issue'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 4 && !skipTime && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Pick a time</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>Only real available slots — travel time included.</p>
            {groups === null ? (
              <div className="flex flex-col gap-3">{[0, 1].map(i => <div key={i} style={{ height: 56, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} className="animate-pulse" />)}</div>
            ) : groups.length === 0 ? (
              <p style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: '#6DA8C4' }}>No free times in the next days. Go back and continue without a time — we'll contact you.</p>
            ) : groupedEntries.map(g => (
              <div key={g.day} className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: W, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{fmtDay(g.day)}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(8,145,178,0.1)' }} />
                </div>
                {[['Morning', g.morning], ['Afternoon', g.afternoon], ['Evening', g.evening]].map(([label, list]) => (list as { start: string; travel: string }[]).length === 0 ? null : (
                  <div key={label as string} className="mb-4">
                    <p style={{ fontSize: 11, color: '#6DA8C4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label as string}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(list as { start: string; travel: string }[]).map(slot => (
                        <button key={slot.start} onClick={() => setSelectedSlot(slot.start)} className={`slot-card text-left ${selectedSlot === slot.start ? 'selected' : ''}`}>
                          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 500, color: '#D9EEF7', marginBottom: 4 }}>{fmtTime(slot.start)}</div>
                          <div style={{ fontSize: 12, color: '#6DA8C4' }}>{slot.travel} travel</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {slotsError && <p style={{ marginTop: 12, fontSize: 13, color: '#EF5350' }}>{slotsError}</p>}
          </div>
        )}

        {step === (skipTime ? 4 : 5) && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Review & confirm</h2>
            <p style={{ color: '#6DA8C4', marginBottom: 24, fontSize: 15 }}>Nothing is confirmed until you press the button below.</p>
            <div style={{ background: 'rgba(7,26,46,0.75)', border: `1px solid rgba(8,145,178,0.12)`, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
              {[
                { label: 'Service', value: ai?.title ?? (isProject ? 'Project request' : 'Repair / Emergency') },
                { label: 'Client', value: form.name || '—' },
                { label: 'Address', value: form.address || '—' },
                { label: 'Phone', value: form.phone || '—' },
                { label: 'Time', value: skipTime ? (isProject ? "We'll contact you" : "We'll contact you to agree a time") : (selectedSlot ? `${fmtDay(selectedSlot)} · ${fmtRange(selectedSlot, ai?.duration_min ?? 60)}` : '—') },
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
              <button onClick={goNext} disabled={!ai && !manual} className="btn-water flex-1 py-4 rounded-xl font-semibold"
                style={{ opacity: !ai && !manual ? 0.4 : 1 }}>Continue →</button>
            )}
            {step === 3 && (
              <button onClick={goNext} disabled={!form.name || form.address.trim().length <= 5 || form.phone.replace(/\D/g, '').length < 7}
                className="btn-water flex-1 py-4 rounded-xl font-semibold"
                style={{ opacity: !form.name || form.address.trim().length <= 5 || form.phone.replace(/\D/g, '').length < 7 ? 0.4 : 1 }}>Continue →</button>
            )}
            {step === 4 && !skipTime && (
              <button onClick={goNext} disabled={!selectedSlot} className="btn-water flex-1 py-4 rounded-xl font-semibold"
                style={{ opacity: !selectedSlot ? 0.4 : 1 }}>Continue →</button>
            )}
            {step === (skipTime ? 4 : 5) && (
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
