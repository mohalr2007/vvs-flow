import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Link, useParams } from '@/figma/router';
import ClientNav from '@/figma/components/ClientNav';
import { bookingService } from '@/lib/services';
import { ACCESS_OPTIONS } from '@/lib/vvs-data';
import { fmtDay, fmtRange } from '@/lib/time';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');
const ICONS: Record<string, string> = { "Yes, I'll be home": '🏠', 'Key with neighbor': '🔑', 'Door code available': '🚪', 'I need to arrange access': '✏️' };
const DESCS: Record<string, string> = { "Yes, I'll be home": 'Someone will let Mats in on arrival.', 'Key with neighbor': "I'll leave a key with a neighbor.", 'Door code available': "I'll share the door code.", 'I need to arrange access': "I'll describe the access in a note." };

export default function Access() {
  const { token } = useParams<{ token: string }>();
  const get = useServerFn(bookingService.byToken), confirm = useServerFn(bookingService.confirmAccess);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['booking', token], queryFn: () => get({ data: { token: token! } }), enabled: !!token, retry: false });
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  const shell = (children: React.ReactNode) => (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />
      <div className="max-w-lg mx-auto px-6 pt-28 pb-16">{children}</div>
    </div>
  );

  if (q.isPending) return shell(<div style={{ height: 240, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} className="animate-pulse" />);
  if (q.isError || !q.data?.job) return shell(
    <div className="text-center">
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>This link isn't valid.</h1>
      <p style={{ color: '#6DA8C4' }}>The booking may have been removed. Please contact Ekström VVS.</p>
    </div>
  );

  const job = q.data.job;
  const when = job.scheduled_at ? `${fmtDay(job.scheduled_at)} · ${fmtRange(job.scheduled_at, job.duration_min)}` : "Time to be agreed — Mats will contact you";
  const canSet = job.status === 'confirmed' || job.status === 'access_confirmed';

  const select = async (choice: string) => {
    setSaving(choice); setError('');
    try { await confirm({ data: { token: token!, choice: choice as typeof ACCESS_OPTIONS[number] } }); await qc.invalidateQueries({ queryKey: ['booking', token] }); }
    catch (e) { setError(errMsg(e)); toast.error(errMsg(e)); } finally { setSaving(''); }
  };

  return shell(
    <>
      <div className="animate-fade-up mb-8 p-5 rounded-2xl" style={{ background: 'rgba(15,22,32,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#6DA8C4', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your booking</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#0891B2' }}>{job.ref}</span>
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: '#D9EEF7', fontWeight: 400, marginBottom: 4 }}>{job.title}</div>
        <div style={{ fontSize: 14, color: '#6DA8C4' }}>{when}</div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.18)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0891B2' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{job.status.replaceAll('_', ' ')}</span>
        </div>
      </div>

      {canSet ? (
        <>
          <div className="animate-fade-up delay-100 mb-6">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 300, color: '#D9EEF7', marginBottom: 6 }}>How will Mats get in?</h2>
            <p style={{ fontSize: 14, color: '#6DA8C4', lineHeight: 1.6 }}>Choose the access method so there's no delay on the day.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up delay-200">
            {ACCESS_OPTIONS.map(opt => (
              <button
                key={opt}
                disabled={!!saving}
                onClick={() => select(opt)}
                className="text-left p-4 rounded-xl transition-all duration-200"
                style={{
                  background: job.access_status === opt ? 'rgba(8,145,178,0.1)' : 'rgba(15,22,32,0.6)',
                  border: `1px solid ${job.access_status === opt ? '#0891B2' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: job.access_status === opt ? '0 0 0 3px rgba(8,145,178,0.12)' : 'none',
                  cursor: saving ? 'default' : 'pointer',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{ICONS[opt]}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#D9EEF7', marginBottom: 4 }}>{saving === opt ? 'Saving…' : opt}</div>
                <div style={{ fontSize: 11, color: '#6DA8C4', lineHeight: 1.4 }}>{DESCS[opt]}</div>
              </button>
            ))}
          </div>

          {error && <p style={{ fontSize: 13, color: '#EF5350', marginBottom: 12 }}>{error}</p>}

          {job.access_status && (
            <div className="animate-slide-up">
              <div className="p-5 rounded-xl flex items-center gap-4 mb-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span style={{ fontSize: 24 }}>✓</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22C55E', marginBottom: 2 }}>Mats has been informed.</div>
                  <div style={{ fontSize: 12, color: '#6DA8C4' }}>Access: {job.access_status}</div>
                </div>
              </div>
              <Link to={`/reschedule/${token}`} className="btn-ghost w-full no-underline flex items-center justify-center py-3 rounded-xl font-semibold text-sm" style={{ color: '#6DA8C4' }}>
                Need another time? Reschedule
              </Link>
            </div>
          )}
        </>
      ) : (
        <p className="rounded-xl p-5 text-sm" style={{ background: 'rgba(15,22,32,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#D9EEF7' }}>
          Status: <strong>{job.status.replaceAll('_', ' ')}</strong>. {job.status === 'needs_assessment' || job.status === 'new' ? "We've received your request and will contact you soon." : 'Contact Ekström VVS if you have questions.'}
        </p>
      )}
    </>
  );
}
