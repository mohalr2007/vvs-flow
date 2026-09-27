import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Link } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { projectService } from '@/lib/services';
import { PROJECT_STEPS, statusLabel } from '@/lib/vvs-data';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

export default function Projects() {
  const { tokens: T } = useDashTheme();
  const list = useServerFn(projectService.list), advance = useServerFn(projectService.advance);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['projects'], queryFn: () => list() });
  const projects = q.data ?? [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Projects</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>Multi-day site work — plan each day, track delays.</p>
        </div>

        {q.isPending ? (
          <p style={{ fontSize: 13, color: T.textMid }}>Loading projects…</p>
        ) : q.isError ? (
          <div>
            <p style={{ fontSize: 13, color: '#E53935' }}>{q.error instanceof Error ? q.error.message : 'Data could not be loaded.'}</p>
            <button onClick={() => q.refetch()} className="btn-water mt-3 px-4 py-2 rounded-lg text-sm">Try again</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20" style={{ color: T.textDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>▣</div>
            <div style={{ fontSize: 14 }}>No projects yet</div>
            <p style={{ fontSize: 12, marginTop: 4 }}>Renovation requests from the booking page appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((p, n) => {
              const i = PROJECT_STEPS.indexOf(p.status);
              const done = p.status === 'completed';
              return (
                <div
                  key={p.id}
                  className="relative rounded-2xl transition-all animate-fade-up"
                  style={{ background: T.card, border: `1px solid ${T.cardBorder}`, padding: 24, animationDelay: `${n * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim }}>{p.ref}</span>
                        <span className="tag" style={{ background: done || p.status === 'project_approved' ? 'rgba(34,197,94,0.12)' : p.status === 'owner_review' ? 'rgba(245,158,11,0.12)' : 'rgba(59,154,196,0.12)', color: done || p.status === 'project_approved' ? '#22C55E' : p.status === 'owner_review' ? '#F59E0B' : '#3B9AC4' }}>{statusLabel(p.status)}</span>
                      </div>
                      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: T.text, fontWeight: 400, marginBottom: 2 }}>
                        <Link to={`/dashboard/projects/${p.id}`} className="no-underline" style={{ color: 'inherit' }}>{p.title}</Link>
                      </h3>
                      <p style={{ fontSize: 13, color: T.textMid }}>{p.customer_name}{p.address ? ` · ${p.address}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: '#0891B2', fontWeight: 300 }}>{p.budget}</div>
                      <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>budget</div>
                    </div>
                  </div>
                  {p.description && <p className="mt-3 line-clamp-2" style={{ fontSize: 13, color: T.textMid }}>{p.description}</p>}
                  <div className="flex gap-1 mt-4">
                    {PROJECT_STEPS.map((s, k) => (
                      <div key={s} title={statusLabel(s)} className="flex-1 h-1.5 rounded-full" style={{ background: k <= i ? '#C47A2E' : T.divider }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${T.divider}` }}>
                    <Link to={`/dashboard/projects/${p.id}`} className="no-underline px-3 py-1.5 rounded-lg text-sm" style={{ color: T.textMid }}>Details</Link>
                    {!done && (
                      <button
                        onClick={async () => {
                          try { const r = await advance({ data: { id: p.id } }); await qc.invalidateQueries({ queryKey: ['projects'] }); toast.success(`Moved to ${statusLabel(r.status)}`); }
                          catch (e) { toast.error(errMsg(e)); }
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                        style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2', border: `1px solid ${T.cardBorderStrong}`, cursor: 'pointer' }}
                      >
                        Next: {statusLabel(PROJECT_STEPS[i + 1] ?? PROJECT_STEPS[i]!)} →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
