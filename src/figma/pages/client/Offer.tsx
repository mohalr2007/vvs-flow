import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Link, useParams } from '@/figma/router';
import ClientNav from '@/figma/components/ClientNav';
import { offerService } from '@/lib/services';
import { fmtDay, fmtRange, fmtTime } from '@/lib/time';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

export default function Offer() {
  const { token } = useParams<{ token: string }>();
  const get = useServerFn(offerService.get), respond = useServerFn(offerService.respond);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['offer', token], queryFn: () => get({ data: { token: token! } }), enabled: !!token, retry: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [bookingToken, setBookingToken] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const refresh = useCallback(() => { qc.invalidateQueries({ queryKey: ['offer', token] }); }, [qc, token]);

  useEffect(() => {
    const offer = q.data?.offer;
    if (offer) setSeconds(offer.secondsLeft);
  }, [q.data]);

  useEffect(() => {
    if (q.data?.offer?.status !== 'pending') return;
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(timer); refresh(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [q.data?.offer?.status, refresh]);

  const act = async (accept: boolean) => {
    setBusy(true); setError('');
    try {
      const r = await respond({ data: { token: token!, accept } });
      setBookingToken(r.accessToken);
      refresh();
    } catch (e) { setError(errMsg(e)); toast.error(errMsg(e)); refresh(); } finally { setBusy(false); }
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ background: '#030E1C', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <ClientNav />
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">{children}</div>
    </div>
  );

  if (q.isPending) return shell(
    <div className="max-w-md w-full text-center">
      <div style={{ height: 240, borderRadius: 16, background: 'rgba(255,255,255,0.05)' }} className="animate-pulse" />
    </div>
  );

  if (q.isError || !q.data?.offer) return shell(
    <div className="max-w-md w-full text-center animate-scale-in">
      <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>This link isn't valid.</h1>
      <p style={{ color: '#6DA8C4' }}>The offer may have been withdrawn.</p>
    </div>
  );

  const offer = q.data.offer;
  const when = `${fmtDay(offer.slot_start)} · ${fmtRange(offer.slot_start, offer.duration_min)}`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = seconds / (15 * 60);
  const circumference = 2 * Math.PI * 54;
  const title = offer.status === 'accepted' ? 'This time is yours.' : offer.status === 'pending' ? 'A time just opened for you.' : offer.status === 'expired' ? 'This offer has expired.' : 'Offer declined.';

  if (offer.status === 'accepted') {
    return shell(
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)' }}>
          <span style={{ fontSize: 36 }}>✓</span>
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>{title}</h1>
        <p style={{ color: '#6DA8C4', marginBottom: 32, lineHeight: 1.6 }}>{when} is reserved for you. Mats will confirm shortly.</p>
        <div style={{ background: 'rgba(15,22,32,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          {[
            { label: 'Date', value: fmtDay(offer.slot_start) },
            { label: 'Arrival window', value: fmtRange(offer.slot_start, offer.duration_min) },
            { label: 'Service', value: offer.waitlist_entries?.title ?? '—' },
            { label: 'Customer', value: offer.waitlist_entries?.customer_name ?? '—' },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(8,145,178,0.07)' }}>
              <span style={{ fontSize: 13, color: '#6DA8C4' }}>{r.label}</span>
              <span style={{ fontSize: 13, color: '#D9EEF7', fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </div>
        {bookingToken && (
          <Link to={`/access/${bookingToken}`} className="btn-copper no-underline w-full inline-flex items-center justify-center py-4 rounded-xl font-semibold">
            Confirm property access →
          </Link>
        )}
      </div>
    );
  }

  if (offer.status === 'declined' || offer.status === 'expired') {
    return shell(
      <div className="max-w-md w-full text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 36, opacity: 0.5 }}>⏱</span>
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 300, color: '#D9EEF7', marginBottom: 8 }}>{title}</h1>
        <p style={{ color: '#6DA8C4', lineHeight: 1.6 }}>
          {offer.status === 'expired'
            ? "The slot has been offered to the next person in line. You remain on the waitlist — we'll contact you when another opens."
            : "You remain on the waitlist. We'll reach out when the next slot becomes available."}
        </p>
      </div>
    );
  }

  return shell(
    <div className="max-w-md w-full animate-fade-up">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.18)' }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#0891B2', animation: 'copper-glow 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Slot available</span>
        </div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 300, color: '#D9EEF7', lineHeight: 1.1, marginBottom: 12 }}>
          A time just<br /><em style={{ fontStyle: 'italic', color: '#0891B2' }}>opened for you.</em>
        </h1>
        <p style={{ color: '#6DA8C4', fontSize: 14, lineHeight: 1.6 }}>
          A cancellation freed this slot. Accept within the time shown — it'll be offered to the next person if you pass.
        </p>
      </div>

      <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(15,22,32,0.8)', border: '1px solid rgba(8,145,178,0.18)' }}>
        <div className="text-center mb-4">
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 28, color: '#D9EEF7', fontWeight: 300 }}>{fmtDay(offer.slot_start)}</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 36, color: '#0891B2', fontWeight: 500, marginTop: 4 }}>{fmtTime(offer.slot_start)} – {fmtTime(new Date(new Date(offer.slot_start).getTime() + offer.duration_min * 60000))}</div>
          <div style={{ fontSize: 13, color: '#6DA8C4', marginTop: 4 }}>{offer.waitlist_entries?.title} · ~{offer.duration_min} min</div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div style={{ fontSize: 13, color: '#6DA8C4', marginBottom: 16, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em' }}>OFFER EXPIRES IN</div>
        <div className="relative" style={{ width: 128, height: 128 }}>
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(8,145,178,0.08)" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="54"
              fill="none"
              stroke={seconds < 60 ? '#E53935' : seconds < 300 ? '#F59E0B' : '#0891B2'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 500, color: '#D9EEF7', lineHeight: 1 }}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#6DA8C4', letterSpacing: '0.06em' }}>remaining</span>
          </div>
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: '#EF5350', textAlign: 'center', marginBottom: 16 }}>{error}</p>}

      <div className="flex flex-col gap-3">
        <button onClick={() => act(true)} disabled={busy} className="btn-copper w-full py-5 rounded-xl text-lg font-bold" style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Confirming…' : 'Accept this time →'}
        </button>
        <button onClick={() => act(false)} disabled={busy} className="btn-ghost w-full py-3 rounded-xl font-semibold text-sm" style={{ color: '#6DA8C4' }}>
          Decline — keep me on the waitlist
        </button>
      </div>
    </div>
  );
}
