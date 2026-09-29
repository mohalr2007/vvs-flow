import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { waitlistService } from '@/lib/services';
import { fmtRange, fmtShortDay, sek } from '@/lib/time';
import type { WaitlistEntry } from '@/lib/vvs-data';

function errMsg(e: unknown) { return e instanceof Error ? e.message : 'Something went wrong'; }
type Match = { entry: WaitlistEntry; score: number; breakdown: { label: string; points: number }[]; eligible: boolean };

function UrgencyBadge({ v }: { v?: string | null }) {
  const safe = v || 'Normal';
  const cfg = safe === 'High' || safe === 'Emergency' ? { bg: 'rgba(239,68,68,0.1)', c: '#F87171', b: 'rgba(239,68,68,0.2)' }
    : safe === 'Normal' ? { bg: 'rgba(234,179,8,0.1)', c: '#FBBF24', b: 'rgba(234,179,8,0.2)' }
    : { bg: 'rgba(34,197,94,0.1)', c: '#4ADE80', b: 'rgba(34,197,94,0.2)' };
  return <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.c, border: `1px solid ${cfg.b}` }}>{safe}</span>;
}

function StatusBadge({ v }: { v?: string | null }) {
  const safe = v || 'waiting';
  const cfg = safe === 'offered' ? { bg: 'rgba(8,145,178,0.1)', c: '#0891B2', b: 'rgba(8,145,178,0.2)' }
    : safe === 'booked' ? { bg: 'rgba(34,197,94,0.1)', c: '#4ADE80', b: 'rgba(34,197,94,0.2)' }
    : { bg: 'rgba(123,97,255,0.1)', c: '#7B61FF', b: 'rgba(123,97,255,0.2)' };
  return <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.c, border: `1px solid ${cfg.b}` }}>{safe}</span>;
}

function WaitlistCard({ entry, T, onDelete, onBook }: {
  entry: WaitlistEntry;
  T: Record<string, string>;
  onDelete: (id: string) => void;
  onBook: (entry: WaitlistEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteFn = useServerFn(waitlistService.delete);

  const name = entry.customer_name || 'Customer';
  const initial = name.trim().charAt(0).toUpperCase() || 'C';

  const handleDelete = async () => {
    if (!confirm(`Remove ${name} from the waitlist?`)) return;
    setDeleting(true);
    try {
      await deleteFn({ data: { id: entry.id } });
      onDelete(entry.id);
      toast.success(`${name} removed from waitlist`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setDeleting(false);
    }
  };

  const createdDate = entry.created_at ? new Date(entry.created_at) : new Date();
  const dateStr = !isNaN(createdDate.getTime()) ? createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: T.cardAlt, border: `1px solid ${open ? T.cardBorderStrong : T.cardBorder}`, transition: 'border-color 0.2s' }}>
      {/* Header row — always visible, clickable */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
        style={{ cursor: 'pointer', background: 'none', border: 'none' }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar initial */}
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Fraunces, serif', fontSize: 14, color: '#7B61FF', fontWeight: 400 }}>
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: 15, fontWeight: 400, color: T.text }}>{name}</span>
              <UrgencyBadge v={entry.urgency} />
              <StatusBadge v={entry.status} />
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.title || 'Plumbing request'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim }}>
            {dateStr}
          </span>
          <span style={{ color: T.textDim, fontSize: 14, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
        </div>
      </button>

      {/* Expanded detail panel */}
      {open && (
        <div style={{ borderTop: `1px solid ${T.divider}`, padding: '16px' }} className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {[
              { label: 'Email', value: entry.email || '—', icon: '✉' },
              { label: 'Phone', value: entry.phone || '—', icon: '📞' },
              { label: 'Zone', value: entry.zone || '—', icon: '📍' },
              { label: 'Flexibility', value: entry.flexibility || '—', icon: '🕐' },
              { label: 'Duration', value: entry.duration_min ? `${entry.duration_min} min` : '—', icon: '⏱' },
              { label: 'Est. value', value: entry.value ? sek(entry.value) : '—', icon: '💰' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: T.text }}>{f.icon} {f.value}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onBook(entry)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2', border: '1px solid rgba(8,145,178,0.25)', cursor: 'pointer' }}
            >
              📅 Book appointment
            </button>
            {entry.email && (
              <a
                href={`mailto:${entry.email}?subject=Ekström VVS — Availability`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold no-underline"
                style={{ background: 'rgba(255,255,255,0.03)', color: T.textMid, border: `1px solid ${T.cardBorder}` }}
              >
                ✉ Contact by email
              </a>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ml-auto"
              style={{ background: 'rgba(239,68,68,0.06)', color: '#EF5350', border: '1px solid rgba(239,68,68,0.15)', cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? '…' : '✕ Remove'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookModal({ entry, T, onClose, onDone }: {
  entry: WaitlistEntry;
  T: Record<string, string>;
  onClose: () => void;
  onDone: () => void;
}) {
  const bookFn = useServerFn(waitlistService.bookDirect);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('18:00');
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    setBusy(true);
    try {
      const dt = new Date(`${date}T${time}:00`);
      if (isNaN(dt.getTime())) {
        throw new Error('Invalid date or time');
      }
      await bookFn({ data: { waitlistId: entry.id, scheduledAt: dt.toISOString() } });
      toast.success(`Appointment confirmed for ${entry.customer_name} on ${date} at ${time}`);
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(3,14,28,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 animate-scale-in" style={{ background: T.card, border: `1px solid ${T.cardBorderStrong}` }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 300, color: T.text, marginBottom: 4 }}>Book appointment</h2>
        <p style={{ fontSize: 13, color: T.textMid, marginBottom: 16 }}>for <strong style={{ color: T.text }}>{entry.customer_name}</strong> — {entry.title || 'Plumbing request'}</p>

        <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.2)' }}>
          <p style={{ fontSize: 11, color: '#22D3EE', margin: 0 }}>
            ✓ Any hour accepted: you can choose daytime, evening, or after-hours slots.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label style={{ display: 'block', fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="vvs-input"
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Start time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="vvs-input"
            />
            {/* Quick preset chips including after-hours */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['08:00', '11:00', '14:00', '17:30', '18:00', '19:00', '20:00'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className="px-2 py-1 rounded text-xs font-mono"
                  style={{
                    background: time === t ? 'rgba(8,145,178,0.2)' : T.input,
                    color: time === t ? '#22D3EE' : T.textMid,
                    border: `1px solid ${time === t ? '#0891B2' : T.cardBorder}`,
                    cursor: 'pointer',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 btn-ghost py-3 rounded-xl text-sm font-semibold">Cancel</button>
          <button
            type="button"
            onClick={handle}
            disabled={!date || busy}
            className="flex-1 btn-water py-3 rounded-xl text-sm font-semibold"
            style={{ opacity: (!date || busy) ? 0.5 : 1, cursor: (!date || busy) ? 'not-allowed' : 'pointer' }}
          >
            {busy ? 'Booking…' : 'Confirm booking →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Waitlist() {
  const { tokens: T } = useDashTheme();
  const qc = useQueryClient();
  const get = useServerFn(waitlistService.get);
  const matchFn = useServerFn(waitlistService.match);
  const send = useServerFn(waitlistService.sendOffer);
  const clearAllFn = useServerFn(waitlistService.clearAll);

  const q = useQuery({ queryKey: ['waitlist'], queryFn: () => get(), refetchInterval: 10000, retry: 2 });
  const [slotId, setSlotId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [bookTarget, setBookTarget] = useState<WaitlistEntry | null>(null);

  const refetch = useCallback(() => { qc.invalidateQueries({ queryKey: ['waitlist'] }); }, [qc]);

  const handleClearAll = async () => {
    if (!confirm('Clear all waitlist entries and pending offers? This will remove all default test candidates.')) return;
    setClearing(true);
    try {
      await clearAllFn();
      await refetch();
      toast.success('Waitlist cleared');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setClearing(false);
    }
  };

  if (q.isLoading) return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-4">
        {[0, 1, 2].map(i => <div key={i} style={{ height: 64, borderRadius: 12, background: T.cardAlt }} className="animate-pulse" />)}
      </div>
    </DashboardLayout>
  );

  if (q.isError || !q.data) return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto text-center py-16">
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>⚠</div>
        <p style={{ fontSize: 14, color: '#E53935', marginBottom: 16 }}>Could not load waitlist.</p>
        <button type="button" onClick={refetch} className="btn-water px-6 py-3 rounded-xl text-sm font-semibold">Try again</button>
      </div>
    </DashboardLayout>
  );

  const d = q.data;
  const entriesList = d.entries ?? [];
  const slotsList = d.slots ?? [];
  const offersList = d.offers ?? [];

  const slot = slotsList.find(s => s.id === slotId) ?? slotsList[0];
  const offer = slot ? offersList.find(o => o.source_job_id === slot.id && (o.status === 'pending' || o.status === 'accepted')) : undefined;

  // Safely extract candidate info from offer relation
  const getOfferCandidate = () => {
    if (!offer) return { name: 'Customer', email: null };
    const ent = offer.waitlist_entries;
    if (Array.isArray(ent)) {
      return { name: ent[0]?.customer_name || 'Customer', email: ent[0]?.email || null };
    }
    return { name: (ent as any)?.customer_name || 'Customer', email: (ent as any)?.email || null };
  };
  const { name: candidateName, email: candidateEmail } = getOfferCandidate();

  const scan = async () => {
    if (!slot) return;
    setScanning(true); setMatches(null); setSelected(null);
    try {
      const [r] = await Promise.all([matchFn({ data: { id: slot.id } }), new Promise(res => setTimeout(res, 800))]);
      setMatches(r as Match[]);
      setSelected((r as Match[]).find(m => m.eligible) ?? null);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setScanning(false); }
  };

  const doSend = async () => {
    if (!slot || !selected) return;
    setSending(true);
    try {
      await send({ data: { jobId: slot.id, waitlistId: selected.entry.id } });
      setMatches(null); setSelected(null); refetch();
      toast.success('15-minute offer created');
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSending(false); }
  };

  return (
    <DashboardLayout>
      {bookTarget && (
        <BookModal
          entry={bookTarget}
          T={T}
          onClose={() => setBookTarget(null)}
          onDone={() => { setBookTarget(null); refetch(); }}
        />
      )}

      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Waitlist</h1>
            <p style={{ fontSize: 13, color: T.textMid }}>Manage registrations and turn cancellations into booked appointments.</p>
          </div>
          {entriesList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                background: 'rgba(239,68,68,0.06)',
                color: '#EF5350',
                border: '1px solid rgba(239,68,68,0.2)',
                cursor: clearing ? 'not-allowed' : 'pointer',
              }}
            >
              {clearing ? 'Clearing…' : '🗑 Clear all entries'}
            </button>
          )}
        </div>

        {/* ── People waiting ─────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 300, color: T.text }}>People waiting</h2>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#7B61FF', background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.2)', borderRadius: 20, padding: '2px 10px' }}>
              {entriesList.length}
            </span>
          </div>

          {entriesList.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: T.cardAlt, border: `1px solid ${T.cardBorder}` }}>
              <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.35 }}>⏳</div>
              <p style={{ fontSize: 13, color: T.textDim }}>Nobody on the waitlist yet. New registrations from <strong style={{ color: T.textMid }}>/waitlist</strong> appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entriesList.map((e: WaitlistEntry) => (
                <WaitlistCard
                  key={e.id}
                  entry={e}
                  T={T}
                  onDelete={refetch}
                  onBook={setBookTarget}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Slot recovery ──────────────────────────────────────── */}
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Slot recovery
        </div>

        {slotsList.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-4">
            {slotsList.map(s => (
              <button key={s.id} type="button" onClick={() => { setSlotId(s.id); setMatches(null); setSelected(null); }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: slot?.id === s.id ? 'rgba(8,145,178,0.15)' : T.input, color: slot?.id === s.id ? '#0891B2' : T.textMid, border: `1px solid ${T.cardBorder}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {s.scheduled_at ? fmtShortDay(s.scheduled_at) : 'Slot'} · {s.scheduled_at ? fmtRange(s.scheduled_at, s.duration_min).split('–')[0] : ''}
              </button>
            ))}
          </div>
        )}

        {!slot ? (
          <div className="text-center py-12" style={{ color: T.textDim }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>◉</div>
            <p style={{ fontSize: 14 }}>No recoverable slots. When an appointment is cancelled, its time appears here.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(229,57,53,0.05)', border: '1px solid rgba(229,57,53,0.2)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#E53935', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Cancelled slot available
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: T.text, fontWeight: 300 }}>{slot.scheduled_at ? fmtShortDay(slot.scheduled_at) : 'Upcoming slot'}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 30, color: '#0891B2', fontWeight: 500, lineHeight: 1.1 }}>{slot.scheduled_at ? fmtRange(slot.scheduled_at, slot.duration_min) : `${slot.duration_min} min`}</div>
                  <div style={{ fontSize: 13, color: T.textMid, marginTop: 4 }}>{slot.duration_min} min · Zone {slot.zone} · was "{slot.title}"</div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: '#22C55E', fontWeight: 300 }}>{sek(slot.value)}</div>
                  <div style={{ fontSize: 12, color: T.textMid }}>slot value</div>
                </div>
              </div>
            </div>

            {offer?.status === 'accepted' ? (
              <div className="rounded-2xl p-6 mb-8 text-center animate-scale-in" style={{ background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.3)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#22C55E', fontWeight: 300, marginBottom: 4 }}>Slot recovered!</div>
                <div style={{ fontSize: 13, color: T.textMid }}>{candidateName} accepted this slot.</div>
              </div>
            ) : offer ? (
              <div className="p-5 rounded-2xl text-center mb-8" style={{ background: 'rgba(8,145,178,0.06)', border: `1px solid ${T.cardBorderStrong}` }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Offer sent to {candidateName}
                </div>
                <div className="flex gap-2 justify-center">
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/offer/${offer.token}`); toast.success('Offer link copied'); }}
                    className="py-2 px-4 rounded-lg text-xs font-mono" style={{ background: T.input, color: T.textMid, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                    Copy link
                  </button>
                  <a href={`/offer/${offer.token}`} target="_blank" rel="noreferrer" className="py-2 px-4 rounded-lg text-xs font-semibold no-underline"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                    Open as customer
                  </a>
                </div>
                <p style={{ fontSize: 11, color: T.textMid, marginTop: 10 }}>
                  {candidateEmail ? 'The customer was notified by email.' : 'No email on file — share the link manually.'}
                </p>
              </div>
            ) : scanning ? (
              <div className="text-center py-12 animate-fade-in">
                <div style={{ fontSize: 36, marginBottom: 16, display: 'inline-block' }}>⟳</div>
                <p style={{ fontSize: 14, color: T.textMid }}>Scanning waitlist for best match…</p>
              </div>
            ) : !matches ? (
              <div className="text-center py-12">
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>◉</div>
                <p style={{ fontSize: 14, color: T.textMid, marginBottom: 24 }}>Find the best-matched client from your waitlist for this slot.</p>
                <button type="button" onClick={scan} className="btn-water px-8 py-4 rounded-xl font-semibold">Find best match →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: T.text, fontWeight: 400 }}>Ranked matches</h3>
                    <button type="button" onClick={scan} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}>
                      Scan again →
                    </button>
                  </div>
                  {matches.length === 0 ? (
                    <div className="text-center py-8" style={{ color: T.textDim }}>Nobody on the waitlist can take this slot.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {matches.map((m, i) => (
                        <button key={m.entry.id} type="button" onClick={() => setSelected(m)} disabled={!m.eligible}
                          className="text-left p-4 rounded-xl transition-all"
                          style={{ background: selected?.entry.id === m.entry.id ? 'rgba(8,145,178,0.08)' : T.cardAlt, border: `1px solid ${selected?.entry.id === m.entry.id ? '#0891B2' : T.cardBorder}`, cursor: m.eligible ? 'pointer' : 'not-allowed', opacity: m.eligible ? 1 : 0.5 }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textDim }}>#{i + 1}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.entry.customer_name || 'Customer'}</span>
                            </div>
                            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 18, color: i === 0 ? '#0891B2' : T.textMid, fontWeight: 600 }}>{m.score}</span>
                          </div>
                          <div style={{ fontSize: 12, color: T.textMid }}>Zone {m.entry.zone} · {m.entry.title} · {m.entry.duration_min} min · {m.eligible ? m.entry.flexibility : "Doesn't fit"}</div>
                          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: T.divider }}>
                            <div style={{ height: '100%', width: `${m.score}%`, background: i === 0 ? '#0891B2' : T.textDim, borderRadius: 999 }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selected && (
                    <button type="button" onClick={doSend} disabled={sending} className="btn-water w-full py-4 rounded-xl font-semibold mt-4">
                      {sending ? 'Sending…' : `Send 15-min offer to ${(selected.entry.customer_name || 'Customer').trim().split(' ')[0]} →`}
                    </button>
                  )}
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
                    <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: T.text, marginBottom: 14, fontWeight: 400 }}>Score breakdown</h4>
                    {selected ? selected.breakdown.map(b => (
                      <div key={b.label} className="flex items-center justify-between py-1.5">
                        <span style={{ fontSize: 12, color: T.textMid, textTransform: 'capitalize' }}>{b.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: T.divider }}>
                            <div style={{ height: '100%', width: `${Math.min(100, b.points * 2.5)}%`, background: '#0891B2', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', width: 24, textAlign: 'right' }}>+{b.points}</span>
                        </div>
                      </div>
                    )) : <p style={{ fontSize: 12, color: T.textMid }}>Select a match to see the score breakdown.</p>}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
