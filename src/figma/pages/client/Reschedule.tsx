import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Link, useParams } from '@/figma/router';
import ClientNav from '@/figma/components/ClientNav';
import { bookingService } from '@/lib/services';
import { fmtDay, fmtRange, fmtShortDay, fmtTime } from '@/lib/time';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

export default function Reschedule() {
  const { token } = useParams<{ token: string }>();
  const get = useServerFn(bookingService.rescheduleOptions), move = useServerFn(bookingService.reschedule);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['reschedule', token], queryFn: () => get({ data: { token: token! } }), enabled: !!token, retry: false });
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);

  const shell = (children: React.ReactNode) => (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">{children}</div>
    </div>
  );

  if (q.isPending) return shell(<div style={{ height: 240, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} className="animate-pulse" />);
  if (q.isError || !q.data?.job) return shell(
    <div className="max-w-md w-full text-center">
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>This link isn't valid.</h1>
      <p style={{ color: '#6DA8C4' }}>Please contact Ekström VVS.</p>
    </div>
  );

  const job = q.data.job as unknown as { scheduled_at: string | null; duration_min: number; title: string };
  const slots = q.data.groups.flatMap(g => g.slots).slice(0, 8);

  if (done) {
    return shell(
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <span style={{ fontSize: 36 }}>✓</span>
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>Rescheduled.</h1>
        <p style={{ color: '#6DA8C4', marginBottom: 24, lineHeight: 1.6 }}>Your new time has been saved. Mats is aware of the change.</p>
        <div style={{ background: 'rgba(15,22,32,0.8)', border: '1px solid rgba(8,145,178,0.18)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#D9EEF7', fontWeight: 300, marginBottom: 4 }}>{fmtDay(done)}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 32, color: '#0891B2', fontWeight: 500 }}>{fmtRange(done, job.duration_min)}</div>
        </div>
        <Link to={`/access/${token}`} className="btn-copper no-underline w-full inline-flex items-center justify-center py-4 rounded-xl font-semibold">
          Confirm property access →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />
      <div className="max-w-lg mx-auto px-6 pt-28 pb-32">
        <div className="animate-fade-up mb-8 p-5 rounded-2xl" style={{ background: 'rgba(15,22,32,0.7)', border: '1px solid rgba(8,145,178,0.1)' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#6DA8C4', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Current booking — kept until you confirm the new time
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: '#D9EEF7' }}>{job.scheduled_at ? fmtDay(job.scheduled_at) : 'Not scheduled yet'}</div>
          {job.scheduled_at && <div style={{ fontFamily: 'JetBrains Mono', fontSize: 26, color: '#0891B2', marginTop: 2 }}>{fmtRange(job.scheduled_at, job.duration_min)}</div>}
          <div style={{ fontSize: 13, color: '#6DA8C4', marginTop: 4 }}>{job.title}</div>
        </div>

        <div className="animate-fade-up delay-100 mb-6">
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#D9EEF7', marginBottom: 6 }}>Choose a new time</h2>
          <p style={{ fontSize: 14, color: '#6DA8C4', lineHeight: 1.6 }}>Select from the next available slots. Your current booking remains until you confirm.</p>
        </div>

        <div className="flex flex-col gap-2 animate-fade-up delay-200 mb-6">
          {slots.length ? slots.map((slot, i) => (
            <button
              key={slot.start}
              onClick={() => setSelected(slot.start)}
              className="flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200"
              style={{
                background: selected === slot.start ? 'rgba(8,145,178,0.1)' : 'rgba(15,22,32,0.5)',
                border: `1px solid ${selected === slot.start ? '#0891B2' : 'rgba(8,145,178,0.1)'}`,
                cursor: 'pointer',
                animationDelay: `${i * 50}ms`,
              }}
            >
              <div>
                <div style={{ color: '#6DA8C4', marginBottom: 2, fontFamily: 'JetBrains Mono', fontSize: 11 }}>{fmtShortDay(slot.start)}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, color: '#D9EEF7', fontWeight: 500 }}>{fmtTime(slot.start)}</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 12, color: '#6DA8C4' }}>{slot.travel} travel</div>
                {selected === slot.start && <div style={{ fontSize: 11, color: '#0891B2', fontWeight: 600, marginTop: 2 }}>Selected ✓</div>}
              </div>
            </button>
          )) : (
            <p style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.04)', fontSize: 13, color: '#6DA8C4' }}>No other times are free right now. Please call Ekström VVS.</p>
          )}
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF5350', marginBottom: 12 }}>{error}</p>}

        <div className="sticky-bar">
          <button
            onClick={async () => {
              setBusy(true); setError('');
              try { await move({ data: { token: token!, slotStart: selected! } }); setDone(selected); qc.invalidateQueries(); }
              catch (e) { setError(errMsg(e)); toast.error(errMsg(e)); } finally { setBusy(false); }
            }}
            disabled={!selected || busy}
            className="btn-copper w-full py-4 rounded-xl font-semibold"
            style={{ opacity: !selected || busy ? 0.4 : 1 }}
          >
            {busy ? 'Confirming…' : 'Confirm new time →'}
          </button>
        </div>
      </div>
    </div>
  );
}
