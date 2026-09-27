import { useState } from 'react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { aiService, jobService } from '@/lib/services';
import { sek } from '@/lib/time';

const SAMPLE_MESSAGES = [
  "Hej! Jag har ett problem med varmvattnet i badrummet. Det verkar som att värmepannan klickar men inte tänder. Det har pågått sedan igår morse. Jag bor på Vasagatan 14. Kan ni hjälpa mig?",
  "Water is dripping from the kitchen tap constantly. Not an emergency but really annoying and my water bill is going up. I'm at Kopparbergsvägen 22.",
  "HEEELP the pipe under my sink is spraying water everywhere!! I've turned off the water but I need someone RIGHT NOW. Pilgatan 31 Västerås",
];

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

type Result = Awaited<ReturnType<typeof aiService.inbox>>;

export default function Inbox() {
  const { tokens: T } = useDashTheme();
  const understand = useServerFn(aiService.inbox);
  const create = useServerFn(jobService.fromInbox);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [creating, setCreating] = useState(false);
  const data = res && 'data' in res ? res.data : null;

  const analyze = async () => {
    if (!message.trim()) return;
    setAnalyzing(true); setRes(null);
    try {
      const r = await understand({ data: { text: message } });
      setRes(r);
    } catch (e) {
      setRes({ error: errMsg(e) });
    } finally {
      setAnalyzing(false);
    }
  };

  const createJob = async () => {
    if (!data) return;
    setCreating(true);
    try {
      const r = await create({ data: { text: message, title: data.title, urgency: data.urgency, duration_min: data.duration_min, value: data.price_high, confidence: data.confidence, location: data.location_hint, missing: data.missing_fields } });
      toast.success('Job created for review');
      navigate(`/dashboard/jobs/${r.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Message Inbox</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>Paste a raw customer message — AI turns it into a structured job request for review.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input side */}
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 12, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Raw message
              </label>
              <textarea
                className="vvs-input"
                style={{ minHeight: 200, resize: 'vertical', background: T.input }}
                placeholder="Paste the customer's message here…"
                maxLength={2000}
                value={message}
                onChange={e => { setMessage(e.target.value); setRes(null); }}
              />
            </div>

            {/* Sample messages */}
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Try a sample
              </div>
              <div className="flex flex-col gap-2">
                {SAMPLE_MESSAGES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setMessage(s); setRes(null); }}
                    className="text-left p-3 rounded-lg text-sm transition-all"
                    style={{ background: T.input, border: `1px solid ${T.cardBorder}`, color: T.textMid, cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={analyze}
              disabled={!message.trim() || analyzing}
              className="btn-water py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ opacity: !message.trim() ? 0.4 : 1 }}
            >
              {analyzing ? (
                <><span style={{ animation: 'ticker 0.8s linear infinite', display: 'inline-block' }}>⟳</span> Analysing…</>
              ) : 'Understand request →'}
            </button>
          </div>

          {/* Result side */}
          <div>
            {!res && !analyzing && (
              <div className="flex flex-col items-center justify-center h-full rounded-2xl py-20" style={{ background: T.cardDim, border: `1px dashed ${T.cardBorder}` }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>◌</div>
                <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center' }}>Paste a message and click<br />"Understand request"</p>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center h-full rounded-2xl py-20 animate-fade-in" style={{ background: T.cardDim, border: `1px solid ${T.cardBorder}` }}>
                <div style={{ fontSize: 36, marginBottom: 12, animation: 'ticker 1s linear infinite', display: 'inline-block' }}>⟳</div>
                <p style={{ fontSize: 13, color: T.textMid }}>Structuring request…</p>
              </div>
            )}

            {res && !analyzing && 'error' in res && (
              <div className="flex flex-col items-center justify-center h-full rounded-2xl py-20" style={{ background: T.cardDim, border: `1px solid rgba(229,57,53,0.2)` }}>
                <p style={{ fontSize: 13, color: '#E53935', textAlign: 'center', padding: '0 24px' }}>{res.error}</p>
              </div>
            )}

            {data && !analyzing && (
              <div className="animate-scale-in" style={{ background: T.card, border: `1px solid ${T.cardBorderStrong}`, borderRadius: 16, padding: 24 }}>
                <div className="flex items-center justify-between mb-5">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Structured request</span>
                  <span className="tag" style={{
                    background: data.confidence >= 60 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                    color: data.confidence >= 60 ? '#22C55E' : '#F59E0B',
                  }}>
                    {data.confidence}% confidence
                  </span>
                </div>
                <p style={{ fontSize: 13, color: T.textMid, marginBottom: 8 }}>{data.summary}</p>
                {[
                  { label: 'Type', value: data.title },
                  { label: 'Urgency', value: data.urgency, highlight: data.urgency === 'Emergency' },
                  { label: 'Location', value: data.location_hint ?? 'Not mentioned' },
                  { label: 'Est. duration', value: `${data.duration_min} min` },
                  { label: 'Price range', value: data.price_high ? `${sek(data.price_low)} – ${sek(data.price_high)}` : 'Site visit' },
                  { label: 'Missing info', value: data.missing_fields.join(', ') || 'Nothing', dim: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2.5" style={{ borderBottom: `1px solid ${T.divider}` }}>
                    <span style={{ fontSize: 13, color: T.textMid }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: row.highlight ? '#E53935' : row.dim ? T.textDim : T.text, fontWeight: row.highlight ? 700 : 500 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <button
                  onClick={createJob}
                  disabled={creating}
                  className="btn-water w-full py-3 rounded-xl text-sm font-semibold mt-5"
                  style={{ opacity: creating ? 0.6 : 1 }}
                >
                  {creating ? 'Creating…' : 'Create job for review →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
