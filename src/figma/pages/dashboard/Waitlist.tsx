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

export default function Waitlist() {
  const { tokens: T } = useDashTheme();
  const qc = useQueryClient();
  const get = useServerFn(waitlistService.get);
  const matchFn = useServerFn(waitlistService.match);
  const send = useServerFn(waitlistService.sendOffer);
  const q = useQuery({ queryKey: ['waitlist'], queryFn: () => get(), refetchInterval: 5000 });
  const [slotId, setSlotId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const refetch = useCallback(() => { qc.invalidateQueries({ queryKey: ['waitlist'] }); }, [qc]);

  if (q.isLoading) return <DashboardLayout><div className="p-4 md:p-8 max-w-5xl mx-auto" style={{ color: T.textMid }}>Loading waitlist…</div></DashboardLayout>;
  if (q.isError || !q.data) return <DashboardLayout><div className="p-4 md:p-8 max-w-5xl mx-auto" style={{ color: '#E53935' }}>Failed to load waitlist.</div></DashboardLayout>;

  const d = q.data;
  const slot = d.slots.find(s => s.id === slotId) ?? d.slots[0];
  const offer = slot ? d.offers.find(o => o.source_job_id === slot.id && (o.status === 'pending' || o.status === 'accepted')) : undefined;

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
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Waitlist Recovery</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>Turn cancellations into bookings — 15-minute offers to best-matched clients.</p>
        </div>

        {d.slots.length > 1 && (
          <div className="flex gap-2 overflow-x-auto mb-4">
            {d.slots.map(s => (
              <button key={s.id} onClick={() => { setSlotId(s.id); setMatches(null); setSelected(null); }}
                className="px-3 py-1.5 rounded-lg text-xs font-mono"
                style={{ background: slot?.id === s.id ? 'rgba(8,145,178,0.15)' : T.input, color: slot?.id === s.id ? '#0891B2' : T.textMid, border: `1px solid ${T.cardBorder}`, cursor: 'pointer' }}>
                {fmtShortDay(s.scheduled_at!)} · {fmtRange(s.scheduled_at!, s.duration_min).split('–')[0]}
              </button>
            ))}
          </div>
        )}

        {!slot ? (
          <div className="text-center py-12" style={{ color: T.textDim }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>◉</div>
            <p style={{ fontSize: 14 }}>No recoverable slots. When an appointment is cancelled, its time appears here for recovery.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(229,57,53,0.05)', border: '1px solid rgba(229,57,53,0.2)' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#E53935', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Cancelled slot available
              </div>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: T.text, fontWeight: 300 }}>{fmtShortDay(slot.scheduled_at!)}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 30, color: '#0891B2', fontWeight: 500, lineHeight: 1.1 }}>{fmtRange(slot.scheduled_at!, slot.duration_min)}</div>
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
                <div style={{ fontSize: 13, color: T.textMid }}>{offer.waitlist_entries?.customer_name} accepted this slot.</div>
              </div>
            ) : offer ? (
              <div className="p-5 rounded-2xl text-center mb-8" style={{ background: 'rgba(8,145,178,0.06)', border: `1px solid ${T.cardBorderStrong}` }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Offer sent to {offer.waitlist_entries?.customer_name}
                </div>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/offer/${offer.token}`); toast.success('Offer link copied'); }}
                    className="py-2 px-4 rounded-lg text-xs font-mono" style={{ background: T.input, color: T.textMid, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                    Copy link
                  </button>
                  <a href={`/offer/${offer.token}`} target="_blank" rel="noreferrer" className="py-2 px-4 rounded-lg text-xs font-semibold no-underline"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)' }}>
                    Open as customer
                  </a>
                </div>
                <p style={{ fontSize: 11, color: T.textMid, marginTop: 10 }}>
                  {offer.waitlist_entries?.email ? 'The customer was notified by email.' : 'No email on file — share the link with the customer.'}
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
                <button onClick={scan} className="btn-water px-8 py-4 rounded-xl font-semibold">Find best match →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: T.text, fontWeight: 400 }}>Ranked matches</h3>
                    <button onClick={scan} style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}>
                      Scan again →
                    </button>
                  </div>
                  {matches.length === 0 ? (
                    <div className="text-center py-8" style={{ color: T.textDim }}>Nobody on the waitlist can take this slot.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {matches.map((m, i) => (
                        <button key={m.entry.id} onClick={() => setSelected(m)} disabled={!m.eligible}
                          className="text-left p-4 rounded-xl transition-all"
                          style={{
                            background: selected?.entry.id === m.entry.id ? 'rgba(8,145,178,0.08)' : T.cardAlt,
                            border: `1px solid ${selected?.entry.id === m.entry.id ? '#0891B2' : T.cardBorder}`,
                            cursor: m.eligible ? 'pointer' : 'not-allowed',
                            opacity: m.eligible ? 1 : 0.5,
                          }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textDim }}>#{i + 1}</span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{m.entry.customer_name}</span>
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
                    <button onClick={doSend} disabled={sending} className="btn-water w-full py-4 rounded-xl font-semibold mt-4">
                      {sending ? 'Sending…' : `Send 15-min offer to ${selected.entry.customer_name.split(' ')[0]} →`}
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
