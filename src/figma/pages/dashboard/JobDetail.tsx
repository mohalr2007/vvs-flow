import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link, useParams } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { jobService } from '@/lib/services';
import { statusLabel, type Job, type SlotGroup } from '@/lib/vvs-data';
import { fmtDay, fmtShortDay, fmtTime } from '@/lib/time';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

export default function JobDetail() {
  const { tokens: T } = useDashTheme();
  const { id } = useParams();
  const qc = useQueryClient();
  const get = useServerFn(jobService.get);
  const q = useQuery({ queryKey: ['job', id], queryFn: () => get({ data: { id: id! } }), enabled: !!id });

  if (q.isPending) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-up" style={{ color: T.textMid, textAlign: 'center', paddingTop: 80 }}>Loading job…</div>
      </DashboardLayout>
    );
  }
  if (q.isError) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-up" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ color: '#E53935', fontSize: 14, marginBottom: 12 }}>{errMsg(q.error)}</div>
          <button onClick={() => q.refetch()} className="btn-ghost px-4 py-2 rounded-lg text-sm">Try again</button>
        </div>
      </DashboardLayout>
    );
  }
  if (!q.data?.job) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-up">
          <Link to="/dashboard/jobs" className="flex items-center gap-1.5 no-underline mb-6" style={{ color: T.textMid, fontSize: 13 }}>← Jobs</Link>
          <div className="text-center py-20" style={{ color: T.textDim }}>
            <div style={{ fontSize: 14 }}>Job not found. It may have been removed or the demo was reset.</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-up">
        <Link to="/dashboard/jobs" className="flex items-center gap-1.5 no-underline mb-6 group"
          style={{ color: T.textMid, fontSize: 13 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.text}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMid}
        >
          ← Jobs
        </Link>
        <Editor job={q.data.job} photoUrl={q.data.photoUrl} jobId={id!} qc={qc} T={T} />
      </div>
    </DashboardLayout>
  );
}

function Editor({ job, photoUrl, jobId, qc, T }: { job: Job; photoUrl: string | null; jobId: string; qc: ReturnType<typeof useQueryClient>; T: any }) {
  const save = useServerFn(jobService.save);
  const approve = useServerFn(jobService.approve);
  const schedule = useServerFn(jobService.schedule);
  const setStatus = useServerFn(jobService.setStatus);

  const [f, setF] = useState({ title: job.title, urgency: job.urgency as 'Low' | 'Normal' | 'High' | 'Emergency', duration_min: job.duration_min, zone: job.zone, value: job.value, description: job.description, site_visit: job.site_visit });
  const [description, setDescription] = useState(job.description);
  useEffect(() => {
    setF({ title: job.title, urgency: job.urgency as 'Low' | 'Normal' | 'High' | 'Emergency', duration_min: job.duration_min, zone: job.zone, value: job.value, description: job.description, site_visit: job.site_visit });
    setDescription(job.description);
  }, [job]);

  const [groups, setGroups] = useState<SlotGroup[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState('');

  const uncertain = job.confidence < 60;
  const open = ['new', 'qualified', 'needs_assessment', 'held'].includes(job.status);
  const valid = f.title.trim().length > 0 && f.duration_min >= 15;

  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('18:00');
  const [showCustom, setShowCustom] = useState(false);

  const bookCustomSlot = async () => {
    if (!customDate) {
      toast.error('Please pick a date');
      return;
    }
    const dt = new Date(`${customDate}T${customTime}:00`);
    if (isNaN(dt.getTime())) {
      toast.error('Invalid date or time');
      return;
    }
    await run('schedule', async () => {
      await schedule({ data: { id: job.id, slotStart: dt.toISOString() } });
      setGroups(null);
      setSelectedSlot(null);
      setShowCustom(false);
      await refresh();
    }, `Appointment booked for ${customDate} at ${customTime}`);
  };

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['job', jobId] }),
    qc.invalidateQueries({ queryKey: ['jobs'] }),
    qc.invalidateQueries({ queryKey: ['overview'] }),
  ]);

  const run = async (label: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(label);
    try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };

  const fields = { ...f, description };

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.textMid }}>{job.ref}</span>
            <span className="tag" style={{ background: job.confidence > 80 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: job.confidence > 80 ? '#22C55E' : '#F59E0B' }}>
              AI {job.confidence}%
            </span>
            {job.urgency === 'Emergency' && (
              <span className="tag" style={{ background: 'rgba(229,57,53,0.12)', color: '#E53935' }}>EMERGENCY</span>
            )}
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: T.text }}>{job.customer_name}</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>{job.address}</p>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textMid }}>
          {new Date(job.created_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      </div>

      {/* AI warning */}
      {uncertain && open && (
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3 animate-fade-up" style={{ background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.25)' }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#EF5350', marginBottom: 2 }}>Manual review recommended</div>
            <div style={{ fontSize: 12, color: '#A07070', lineHeight: 1.5 }}>
              The request is unusual. Confirm the work type, duration and whether a site visit is needed before approving.
              {job.missing_fields?.length > 0 && ` Missing: ${job.missing_fields.join(' · ')}`}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: editable form */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: T.text, marginBottom: 16, fontWeight: 400 }}>Job details</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Type</label>
                <input className="vvs-input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} style={{ background: T.input }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Urgency</label>
                  <select className="vvs-input" value={f.urgency} onChange={e => setF({ ...f, urgency: e.target.value as typeof f.urgency })} style={{ background: T.input }}>
                    {['Low', 'Normal', 'High', 'Emergency'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Zone</label>
                  <input className="vvs-input" value={f.zone} onChange={e => setF({ ...f, zone: e.target.value })} style={{ background: T.input }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Duration (min)</label>
                  <input type="number" min={15} step={15} className="vvs-input" value={f.duration_min} onChange={e => setF({ ...f, duration_min: +e.target.value })} style={{ background: T.input }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Estimate (SEK)</label>
                  <input type="number" min={0} className="vvs-input" value={f.value} onChange={e => setF({ ...f, value: +e.target.value })} style={{ background: T.input }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Client description</label>
                <textarea className="vvs-input" style={{ minHeight: 90, resize: 'vertical', background: T.input }} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <button
              disabled={!valid || !!busy}
              onClick={() => run('save', async () => { await save({ data: { id: job.id, fields } }); await refresh(); }, 'Details saved')}
              className="btn-ghost w-full py-2.5 rounded-lg text-sm font-medium mt-4"
            >
              {busy === 'save' ? 'Saving…' : 'Save edited details'}
            </button>
          </div>

          {/* Client info */}
          <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: T.text, marginBottom: 14, fontWeight: 400 }}>Client</h3>
            {[
              { label: 'Name', value: job.customer_name },
              { label: 'Phone', value: job.phone },
              { label: 'Address', value: job.address },
              { label: 'Zone', value: job.zone },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.divider}` }}>
                <span style={{ fontSize: 12, color: T.textMid }}>{r.label}</span>
                <span style={{ fontSize: 12, color: T.text }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Attached Photo */}
          {(photoUrl || job.photo_path) && (
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: T.text, fontWeight: 400 }}>Attached photo</h3>
                <span className="tag" style={{ background: 'rgba(8,145,178,0.12)', color: '#22D3EE' }}>Customer upload</span>
              </div>
              {photoUrl ? (
                <div className="flex flex-col gap-2">
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: T.cardBorder }}>
                    <img
                      src={photoUrl}
                      alt="Customer issue photo"
                      className="w-full h-auto max-h-80 object-contain rounded-xl bg-black/30"
                    />
                  </div>
                  <a
                    href={photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium self-end transition-opacity hover:opacity-80"
                    style={{ color: '#22D3EE', textDecoration: 'none' }}
                  >
                    View full size ↗
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-xl flex items-center gap-2" style={{ background: T.input, color: T.textMid }}>
                  <span style={{ fontSize: 18 }}>📷</span>
                  <span style={{ fontSize: 12 }}>Photo uploaded ({job.photo_path}) — loading secure link…</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Decision panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorderStrong}` }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: T.text, marginBottom: 14, fontWeight: 400 }}>Decision</h3>

            {open && !groups && !showCustom ? (
              <div className="flex flex-col gap-2 mb-3">
                <button
                  disabled={!valid || !!busy}
                  onClick={() => run('approve', async () => {
                    const r = await approve({ data: { id: job.id, fields } });
                    setGroups(r.groups);
                    await refresh();
                  }, 'Details approved')}
                  className="btn-copper w-full py-3 rounded-xl font-semibold text-sm"
                >
                  {busy === 'approve' ? 'Finding slots…' : 'Approve & Find Route Slots →'}
                </button>
                <button
                  onClick={() => setShowCustom(true)}
                  className="btn-ghost w-full py-2.5 rounded-xl text-xs font-medium"
                >
                  🌙 Set custom / after-hours time
                </button>
              </div>
            ) : open && showCustom ? (
              <div className="p-4 rounded-xl mb-3 flex flex-col gap-3" style={{ background: T.cardAlt, border: `1px solid ${T.cardBorder}` }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    🌙 Custom / After-hours
                  </span>
                  <button onClick={() => setShowCustom(false)} style={{ background: 'none', border: 'none', color: T.textMid, cursor: 'pointer', fontSize: 12 }}>
                    ✕ Cancel
                  </button>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Date</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="vvs-input"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    className="vvs-input"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['17:30', '18:00', '18:30', '19:00', '20:00'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomTime(t)}
                        className="px-2 py-1 rounded text-xs font-mono"
                        style={{ background: customTime === t ? 'rgba(8,145,178,0.2)' : T.input, color: customTime === t ? '#22D3EE' : T.textMid, border: `1px solid ${customTime === t ? '#0891B2' : T.cardBorder}` }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  disabled={!customDate || !!busy}
                  onClick={bookCustomSlot}
                  className="btn-copper w-full py-2.5 rounded-lg text-sm font-semibold mt-1"
                >
                  {busy === 'schedule' ? 'Booking…' : 'Confirm this appointment ✓'}
                </button>
              </div>
            ) : groups ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#22C55E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    ✓ Approved — pick a slot
                  </div>
                  <button
                    onClick={() => setShowCustom(v => !v)}
                    style={{ background: 'none', border: 'none', color: '#0891B2', fontSize: 11, cursor: 'pointer', fontFamily: 'JetBrains Mono' }}
                  >
                    {showCustom ? 'Show route slots' : '🌙 Custom time'}
                  </button>
                </div>
                {showCustom ? (
                  <div className="p-4 rounded-xl mb-3 flex flex-col gap-3" style={{ background: T.cardAlt, border: `1px solid ${T.cardBorder}` }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Date</label>
                      <input
                        type="date"
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="vvs-input"
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', marginBottom: 4 }}>Time</label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        className="vvs-input"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['17:30', '18:00', '18:30', '19:00', '20:00'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setCustomTime(t)}
                            className="px-2 py-1 rounded text-xs font-mono"
                            style={{ background: customTime === t ? 'rgba(8,145,178,0.2)' : T.input, color: customTime === t ? '#22D3EE' : T.textMid, border: `1px solid ${customTime === t ? '#0891B2' : T.cardBorder}` }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      disabled={!customDate || !!busy}
                      onClick={bookCustomSlot}
                      className="btn-copper w-full py-2.5 rounded-lg text-sm font-semibold mt-1"
                    >
                      {busy === 'schedule' ? 'Booking…' : 'Confirm this appointment ✓'}
                    </button>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="mb-3">
                    <p style={{ fontSize: 12, color: T.textMid, marginBottom: 8 }}>No route slots in normal hours.</p>
                    <button onClick={() => setShowCustom(true)} className="btn-water w-full py-2 rounded-lg text-xs font-semibold">
                      🌙 Pick after-hours / custom time
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-3">
                    {groups.flatMap(g => g.slots.map(s => (
                      <button
                        key={s.start}
                        onClick={() => setSelectedSlot(s.start)}
                        className="text-left p-3 rounded-lg transition-all"
                        style={{
                          background: selectedSlot === s.start ? 'rgba(8,145,178,0.12)' : 'rgba(8,145,178,0.04)',
                          border: `1px solid ${selectedSlot === s.start ? '#0891B2' : T.cardBorder}`,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: T.text }}>
                          {fmtShortDay(g.day)} · {fmtTime(s.start)}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMid }}>{s.travel}</div>
                      </button>
                    )))}
                  </div>
                )}
                {selectedSlot && !showCustom && (
                  <button
                    disabled={!!busy}
                    onClick={() => run('schedule', async () => {
                      await schedule({ data: { id: job.id, slotStart: selectedSlot } });
                      setGroups(null);
                      setSelectedSlot(null);
                      await refresh();
                    }, 'Slot booked')}
                    className="btn-copper w-full py-2.5 rounded-lg text-sm font-semibold"
                  >
                    {busy === 'schedule' ? 'Booking…' : 'Book this slot ✓'}
                  </button>
                )}
              </div>
            ) : null}

            <div className="copper-line my-4" />

            <div className="flex flex-col gap-2">
              {(job.status === 'confirmed' || job.status === 'access_confirmed') && (
                <button
                  disabled={!!busy}
                  onClick={() => run('start', async () => { await setStatus({ data: { id: job.id, status: 'in_progress' } }); await refresh(); }, 'Job started')}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer' }}
                >
                  Start job
                </button>
              )}
              {job.status === 'in_progress' && (
                <button
                  disabled={!!busy}
                  onClick={() => run('complete', async () => { await setStatus({ data: { id: job.id, status: 'completed' } }); await refresh(); }, 'Completed — ROT summary prepared')}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer' }}
                >
                  Mark completed ✓
                </button>
              )}
              {open && (
                <button
                  disabled={!!busy}
                  onClick={() => run('waitlist', async () => { await setStatus({ data: { id: job.id, status: 'waitlisted' } }); await refresh(); }, 'Added to waitlist')}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(123,97,255,0.1)', color: '#7B61FF', border: '1px solid rgba(123,97,255,0.2)', cursor: 'pointer' }}
                >
                  Move to waitlist
                </button>
              )}
              {!['cancelled', 'completed', 'expired'].includes(job.status) && (
                <button
                  disabled={!!busy}
                  onClick={() => { if (confirm('Cancel this job? A scheduled slot becomes recoverable from the waitlist.')) run('cancel', async () => { await setStatus({ data: { id: job.id, status: 'cancelled' } }); await refresh(); }, 'Cancelled — slot can be recovered'); }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(229,57,53,0.06)', color: '#E53935', border: '1px solid rgba(229,57,53,0.15)', cursor: 'pointer' }}
                >
                  Cancel appointment
                </button>
              )}
            </div>

            {job.status === 'cancelled' && (
              <div className="mt-3 p-3 rounded-lg animate-slide-up" style={{ background: T.divider, border: `1px solid ${T.cardBorderStrong}` }}>
                <div style={{ fontSize: 12, color: '#0891B2' }}>
                  <Link to="/dashboard/waitlist" style={{ color: '#0891B2' }}>Recover this slot from the waitlist →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Current status */}
          <div className="p-4 rounded-xl" style={{ background: T.cardAlt, border: `1px solid ${T.divider}` }}>
            <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Current status</div>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 600, textTransform: 'capitalize' }}>
              {statusLabel(job.status)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
