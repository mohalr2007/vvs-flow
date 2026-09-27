// @ts-nocheck -- temporary until real data is wired
import { useState } from 'react';
import { useNavigate } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';

const SAMPLE_MESSAGES = [
  "Hej! Jag har ett problem med varmvattnet i badrummet. Det verkar som att värmepannan klickar men inte tänder. Det har pågått sedan igår morse. Jag bor på Vasagatan 14. Kan ni hjälpa mig?",
  "Water is dripping from the kitchen tap constantly. Not an emergency but really annoying and my water bill is going up. I'm at Kopparbergsvägen 22.",
  "HEEELP the pipe under my sink is spraying water everywhere!! I've turned off the water but I need someone RIGHT NOW. Pilgatan 31 Västerås",
];

export default function Inbox() {
  const { tokens: T } = useDashTheme();
  const [message, setMessage] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<null | Record<string, string>>(null);
  const navigate = useNavigate();

  const analyze = () => {
    if (!message.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        type: message.toLowerCase().includes('spray') || message.toLowerCase().includes('spraying') ? 'Emergency repair' : message.toLowerCase().includes('dripping') ? 'Repair — dripping tap' : 'Repair — boiler/hot water',
        urgency: message.toLowerCase().includes('spray') || message.toLowerCase().includes('right now') ? 'EMERGENCY' : message.toLowerCase().includes('dripping') ? 'Low' : 'Medium',
        location: message.match(/[A-Za-zÅÄÖåäö]+gatan \d+|[A-Za-zÅÄÖåäö]+vägen \d+/i)?.[0] || 'Not specified',
        duration: message.toLowerCase().includes('spray') ? '45 – 60 min' : '60 – 90 min',
        estimate: message.toLowerCase().includes('spray') ? '3 500 – 5 500 SEK' : message.toLowerCase().includes('dripping') ? '800 – 1 200 SEK' : '2 200 – 3 400 SEK',
        missing: message.toLowerCase().includes('right now') ? 'Phone number, full address' : 'Phone number',
        aiScore: message.toLowerCase().includes('spray') || message.toLowerCase().includes('right now') ? '96%' : '89%',
      });
    }, 1800);
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
                value={message}
                onChange={e => { setMessage(e.target.value); setResult(null); }}
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
                    onClick={() => { setMessage(s); setResult(null); }}
                    className="text-left p-3 rounded-lg text-sm transition-all"
                    style={{ background: T.input, border: `1px solid ${T.cardBorder}`, color: T.textMid, cursor: 'pointer', lineClamp: 2 }}
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
            {!result && !analyzing && (
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

            {result && !analyzing && (
              <div className="animate-scale-in" style={{ background: T.card, border: `1px solid ${T.cardBorderStrong}`, borderRadius: 16, padding: 24 }}>
                <div className="flex items-center justify-between mb-5">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#0891B2', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Structured request</span>
                  <span className="tag" style={{
                    background: parseInt(result.aiScore) >= 90 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                    color: parseInt(result.aiScore) >= 90 ? '#22C55E' : '#F59E0B',
                  }}>
                    {result.aiScore} confidence
                  </span>
                </div>
                {[
                  { label: 'Type', value: result.type },
                  { label: 'Urgency', value: result.urgency, highlight: result.urgency === 'EMERGENCY' },
                  { label: 'Location', value: result.location },
                  { label: 'Est. duration', value: result.duration },
                  { label: 'Price range', value: result.estimate },
                  { label: 'Missing info', value: result.missing, dim: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2.5" style={{ borderBottom: `1px solid ${T.divider}` }}>
                    <span style={{ fontSize: 13, color: T.textMid }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: row.highlight ? '#E53935' : row.dim ? T.textDim : T.text, fontWeight: row.highlight ? 700 : 500 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/dashboard/jobs/J-2401')}
                  className="btn-water w-full py-3 rounded-xl text-sm font-semibold mt-5"
                >
                  Create job for review →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
