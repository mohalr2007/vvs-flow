import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { rotService } from '@/lib/services';
import type { RotRecord } from '@/lib/vvs-data';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Review: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  Ready: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E' },
  Exported: { bg: 'rgba(74,85,104,0.12)', color: '#6DA8C4' },
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');
const eligible = (r: RotRecord) => Math.round(r.labor * 0.3);

function download(rows: RotRecord[]) {
  const csv = [['Customer', 'Work', 'Labor SEK', 'Materials SEK', 'Est. ROT deduction SEK', 'Status'], ...rows.map(r => [r.customer, r.work, r.labor, r.materials, eligible(r), r.status])]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `rot-summary-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
}

export default function ROT() {
  const { tokens: T } = useDashTheme();
  const list = useServerFn(rotService.list), setStatusFn = useServerFn(rotService.setStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['rot'], queryFn: () => list() });
  const summaries = q.data ?? [];

  const change = async (id: string, status: 'Ready' | 'Review' | 'Exported') => {
    try { await setStatusFn({ data: { id, status } }); await qc.invalidateQueries({ queryKey: ['rot'] }); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const readyCount = summaries.filter(s => s.status === 'Ready').length;
  const totalDeduction = summaries.reduce((acc, s) => acc + eligible(s), 0);

  const exportReady = async () => {
    const ready = summaries.filter(s => s.status === 'Ready');
    download(ready);
    for (const r of ready) await change(r.id, 'Exported');
    toast.success(`${ready.length} summaries exported to CSV`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>ROT Summaries</h1>
            <p style={{ fontSize: 13, color: T.textMid }}>Swedish tax deduction (ROT ≈ 30% of labour) for completed work.</p>
          </div>
          <button
            disabled={readyCount === 0}
            onClick={exportReady}
            className="btn-copper px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2"
            style={{ opacity: readyCount === 0 ? 0.4 : 1 }}
          >
            Export ready summaries (CSV)
          </button>
        </div>

        {q.isPending ? (
          <p style={{ fontSize: 13, color: T.textMid }}>Loading ROT summaries…</p>
        ) : q.isError ? (
          <div>
            <p style={{ fontSize: 13, color: '#E53935' }}>{q.error instanceof Error ? q.error.message : 'Data could not be loaded.'}</p>
            <button onClick={() => q.refetch()} className="btn-water mt-3 px-4 py-2 rounded-lg text-sm">Try again</button>
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-20" style={{ color: T.textDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◧</div>
            <div style={{ fontSize: 14 }}>No completed work yet</div>
            <p style={{ fontSize: 12, marginTop: 4 }}>Completing a job prepares its ROT summary here.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: T.input, border: `1px dashed ${T.cardBorderStrong}` }}>
              <span style={{ fontSize: 14 }}>ℹ</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', letterSpacing: '0.04em' }}>Demo export — no government connection</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total deductions', value: `${totalDeduction.toLocaleString('sv-SE')} SEK`, color: '#0891B2' },
                { label: 'Ready to export', value: readyCount, color: '#22C55E' },
                { label: 'Pending review', value: summaries.filter(s => s.status === 'Review').length, color: '#F59E0B' },
              ].map(stat => (
                <div key={stat.label} className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, color: stat.color, fontWeight: 300 }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <div className="grid grid-cols-12 px-5 py-3" style={{ borderBottom: `1px solid ${T.cardBorder}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Client', 'Work', 'Labour (SEK)', 'Materials (SEK)', 'ROT (SEK)', 'Status'].map(h => (
                  <div key={h} className="col-span-2" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                ))}
              </div>
              {summaries.map((s, i) => (
                <div key={s.id} className="grid grid-cols-12 px-5 py-4 items-center animate-fade-up"
                  style={{ borderBottom: i < summaries.length - 1 ? `1px solid rgba(8,145,178,0.05)` : 'none', animationDelay: `${i * 60}ms` }}>
                  <div className="col-span-2">
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.customer}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim }}>{s.id.slice(0, 8)}</div>
                  </div>
                  <div className="col-span-2" style={{ fontSize: 13, color: T.textMid }}>{s.work}</div>
                  <div className="col-span-2" style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: T.text }}>{s.labor.toLocaleString('sv-SE')}</div>
                  <div className="col-span-2" style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: T.text }}>{s.materials.toLocaleString('sv-SE')}</div>
                  <div className="col-span-2" style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: '#0891B2', fontWeight: 300 }}>{eligible(s).toLocaleString('sv-SE')}</div>
                  <div className="col-span-2">
                    <select value={s.status} onChange={e => change(s.id, e.target.value as 'Ready')} className="text-sm rounded-lg px-2 py-1.5"
                      style={{ background: STATUS_COLORS[s.status]?.bg, color: STATUS_COLORS[s.status]?.color, border: `1px solid ${STATUS_COLORS[s.status]?.color}44`, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                      {['Review', 'Ready', 'Exported'].map(st => <option key={st} value={st} style={{ background: '#0F1620', color: T.text }}>{st}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:hidden flex flex-col gap-3">
              {summaries.map((s, i) => (
                <div key={s.id} className="rounded-2xl p-4 animate-fade-up" style={{ background: T.card, border: `1px solid ${T.cardBorder}`, animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.customer}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim, marginTop: 2 }}>{s.id.slice(0, 8)} · {s.work}</div>
                    </div>
                    <select value={s.status} onChange={e => change(s.id, e.target.value as 'Ready')} className="text-sm rounded-lg px-2 py-1"
                      style={{ background: STATUS_COLORS[s.status]?.bg, color: STATUS_COLORS[s.status]?.color, border: `1px solid ${STATUS_COLORS[s.status]?.color}44`, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                      {['Review', 'Ready', 'Exported'].map(st => <option key={st} value={st} style={{ background: '#0F1620', color: T.text }}>{st}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Labour', value: s.labor.toLocaleString('sv-SE') },
                      { label: 'Materials', value: s.materials.toLocaleString('sv-SE') },
                      { label: 'ROT', value: eligible(s).toLocaleString('sv-SE'), accent: true },
                    ].map(cell => (
                      <div key={cell.label} className="p-2 rounded-lg" style={{ background: T.cardAlt }}>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{cell.label}</div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: cell.accent ? '#0891B2' : T.text, fontWeight: 600 }}>{cell.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
