import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { leadService } from '@/lib/services';
import { sek } from '@/lib/time';

const STAGES = ['New', 'Qualified', 'Held', 'Abandoned', 'Converted'] as const;
type Stage = (typeof STAGES)[number];

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  New: { bg: 'rgba(59,154,196,0.12)', color: '#3B9AC4' },
  Qualified: { bg: 'rgba(8,145,178,0.12)', color: '#0891B2' },
  Converted: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E' },
  Held: { bg: 'rgba(74,85,104,0.12)', color: '#6DA8C4' },
  Abandoned: { bg: 'rgba(229,57,53,0.12)', color: '#E53935' },
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

export default function Leads() {
  const { tokens: T } = useDashTheme();
  const list = useServerFn(leadService.list), setStageFn = useServerFn(leadService.setStage);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['leads'], queryFn: () => list() });
  const [filter, setFilter] = useState('All');

  const change = async (id: string, stage: Stage, msg: string) => {
    try {
      await setStageFn({ data: { id, stage } });
      await qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success(msg);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const leads = q.data ?? [];
  const filtered = filter === 'All' ? leads : leads.filter(l => l.stage === filter);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Leads</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>Every inquiry stays visible until it has a clear outcome. {leads.filter(l => l.stage === 'Abandoned').length} abandoned — recoverable.</p>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {['All', ...STAGES].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === s ? 'rgba(8,145,178,0.12)' : 'rgba(8,145,178,0.04)',
                color: filter === s ? '#0891B2' : T.textMid,
                border: `1px solid ${filter === s ? 'rgba(8,145,178,0.3)' : T.cardBorder}`,
                cursor: 'pointer',
              }}
            >
              {s}
              {s !== 'All' && (
                <span className="ml-1.5" style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                  ({leads.filter(l => l.stage === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {q.isPending ? (
          <p style={{ fontSize: 13, color: T.textMid }}>Loading leads…</p>
        ) : q.isError ? (
          <div>
            <p style={{ fontSize: 13, color: '#E53935' }}>{q.error instanceof Error ? q.error.message : 'Data could not be loaded.'}</p>
            <button onClick={() => q.refetch()} className="btn-water mt-3 px-4 py-2 rounded-lg text-sm">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: T.textDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 14 }}>No leads in this stage</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((lead, i) => (
              <div
                key={lead.id}
                className="flex items-center gap-4 px-5 py-4 rounded-xl animate-fade-up flex-wrap"
                style={{
                  background: T.card,
                  border: lead.stage === 'Abandoned' ? '1px solid rgba(229,57,53,0.15)' : `1px solid ${T.divider}`,
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{lead.name}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim }}>{lead.id.slice(0, 8)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMid, marginTop: 1 }}>
                    {lead.work} · {new Date(lead.created_at).toLocaleDateString('sv-SE')}
                  </div>
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: '#0891B2', fontWeight: 300, flexShrink: 0 }}>
                  {sek(lead.value)}
                </div>
                <select
                  value={lead.stage}
                  onChange={e => change(lead.id, e.target.value as Stage, 'Stage updated')}
                  className="text-sm rounded-lg px-2 py-1.5 transition-all"
                  style={{
                    background: STAGE_COLORS[lead.stage]?.bg || T.input,
                    color: STAGE_COLORS[lead.stage]?.color || T.textMid,
                    border: `1px solid ${STAGE_COLORS[lead.stage]?.color || T.textMid}44`,
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                  }}
                >
                  {STAGES.map(s => (
                    <option key={s} value={s} style={{ background: '#0F1620', color: T.text }}>{s}</option>
                  ))}
                </select>
                {lead.stage === 'Abandoned' && (
                  <button
                    onClick={() => change(lead.id, 'Qualified', 'Opportunity recovered')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                    style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2', border: `1px solid ${T.cardBorderStrong}`, cursor: 'pointer' }}
                  >
                    Recover →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
