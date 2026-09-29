import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { jobService } from '@/lib/services';
import { statusLabel, statusTone, type Job } from '@/lib/vvs-data';

const TONE_STYLE: Record<string, { bg: string; color: string }> = {
  neutral: { bg: 'rgba(74,85,104,0.12)', color: '#2E5B75' },
  success: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E' },
  warning: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  danger: { bg: 'rgba(229,57,53,0.12)', color: '#E53935' },
  info: { bg: 'rgba(59,154,196,0.12)', color: '#3B9AC4' },
};

const URGENCY_COLORS: Record<string, string> = {
  Emergency: '#E53935',
  High: '#F59E0B',
  Normal: '#3B9AC4',
  Low: '#2E5B75',
};

const FILTERS = { All: () => true, Review: (s: string) => s === 'new' || s === 'qualified', Assessment: (s: string) => s === 'needs_assessment', Scheduled: (s: string) => s === 'confirmed' || s === 'access_confirmed' || s === 'in_progress', Closed: (s: string) => ['completed', 'cancelled', 'expired', 'waitlisted'].includes(s) } as const;

export default function Jobs() {
  const { tokens: T } = useDashTheme();
  const [filter, setFilter] = useState<keyof typeof FILTERS>('All');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const list = useServerFn(jobService.list);
  const approve = useServerFn(jobService.approve);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['jobs'], queryFn: () => list() });

  const quickApprove = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setApproving(jobId);
    try {
      await approve({ data: { id: jobId } });
      await qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      toast.success('Job approved — find available slots in the job detail');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not approve');
    } finally {
      setApproving(null);
    }
  };

  const jobs: Job[] = q.data ?? [];
  const term = search.trim().toLowerCase();
  const filtered = jobs.filter(j => {
    const matchFilter = FILTERS[filter](j.status);
    const matchSearch = !term || j.customer_name.toLowerCase().includes(term) || j.title.toLowerCase().includes(term) || j.ref.toLowerCase().includes(term);
    return matchFilter && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Jobs</h1>
            <p style={{ fontSize: 13, color: T.textMid }}>{jobs.length} total · {jobs.filter(j => j.status === 'new' || j.status === 'qualified').length} need review</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            className="vvs-input"
            placeholder="Search by client or type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280, background: T.input }}
          />
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: filter === f ? 'rgba(8,145,178,0.12)' : 'rgba(8,145,178,0.04)',
                  color: filter === f ? '#0891B2' : T.textMid,
                  border: `1px solid ${filter === f ? 'rgba(8,145,178,0.3)' : T.cardBorder}`,
                  cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs list */}
        {q.isPending ? (
          <div className="text-center py-20" style={{ color: T.textDim, fontSize: 14 }}>Loading jobs…</div>
        ) : q.isError ? (
          <div className="text-center py-20">
            <div style={{ color: '#E53935', fontSize: 14, marginBottom: 12 }}>
              {q.error instanceof Error ? q.error.message : 'Jobs could not be loaded.'}
            </div>
            <button onClick={() => q.refetch()} className="btn-ghost px-4 py-2 rounded-lg text-sm">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: T.textDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◌</div>
            <div style={{ fontSize: 14 }}>No jobs match this filter</div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((job, i) => {
              const tone = statusTone(job.status);
              const toneStyle = (TONE_STYLE[tone] ?? TONE_STYLE['neutral'])!;
              const aiWarning = job.confidence < 60;
              return (
                <Link
                  key={job.id}
                  to={`/dashboard/jobs/${job.id}`}
                  className="no-underline flex items-center gap-4 px-5 py-4 rounded-xl transition-all group animate-fade-up"
                  style={{
                    background: T.card,
                    border: aiWarning ? '1px solid rgba(229,57,53,0.2)' : `1px solid ${T.divider}`,
                    animationDelay: `${i * 40}ms`,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(8,145,178,0.25)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = aiWarning ? 'rgba(229,57,53,0.2)' : T.divider}
                >
                  {/* Urgency dot */}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: URGENCY_COLORS[job.urgency] || '#3B9AC4' }} />

                  {/* Client + type */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{job.customer_name}</span>
                      {aiWarning && (
                        <span className="tag" style={{ background: 'rgba(229,57,53,0.12)', color: '#E53935' }}>AI flag</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMid, marginTop: 1 }}>
                      {job.ref} · {job.title} · {job.zone}
                    </div>
                  </div>

                  {/* Estimate */}
                  <div className="hidden sm:block text-right">
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#0891B2' }}>{job.value.toLocaleString('sv-SE')} SEK</div>
                    <div style={{ fontSize: 11, color: T.textDim }}>{job.duration_min} min</div>
                  </div>

                  {/* AI score */}
                  <div className="hidden md:flex flex-col items-center">
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: job.confidence > 80 ? '#22C55E' : job.confidence > 60 ? '#F59E0B' : '#E53935' }}>
                      {job.confidence}%
                    </div>
                    <div style={{ fontSize: 10, color: T.textDim }}>AI conf.</div>
                  </div>

                  {/* Status */}
                  <span className="tag" style={{ background: toneStyle.bg, color: toneStyle.color }}>
                    {statusLabel(job.status)}
                  </span>

                  {/* Quick approve for review-stage jobs */}
                  {(job.status === 'new' || job.status === 'qualified') && !aiWarning ? (
                    <button
                      onClick={(e) => quickApprove(e, job.id)}
                      disabled={approving === job.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                      style={{
                        background: approving === job.id ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.12)',
                        color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.25)',
                        cursor: approving === job.id ? 'not-allowed' : 'pointer',
                        opacity: approving === job.id ? 0.6 : 1,
                      }}
                    >
                      {approving === job.id ? '…' : '✓ Approve'}
                    </button>
                  ) : (
                    <span style={{ color: T.textDim, fontSize: 12 }}>→</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
