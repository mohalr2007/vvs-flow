import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { ownerService } from '@/lib/services';
import { statusLabel, statusTone } from '@/lib/vvs-data';
import { fmtDay, fmtTime, sek } from '@/lib/time';

const TONE_COLOR: Record<string, string> = {
  neutral: '#3B9AC4',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#E53935',
  info: '#3B9AC4',
};

function TimelineBlock({ time, title, customer, tone, current }: { time: string; title: string; customer: string; tone: string; current?: boolean }) {
  const { tokens: T } = useDashTheme();
  if (current) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#E53935', boxShadow: '0 0 6px rgba(229,57,53,0.6)' }} />
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#E53935' }}>Now — {time}</span>
      </div>
    );
  }
  const color = TONE_COLOR[tone] || '#3B9AC4';
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{customer}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textMid }}>{time}</span>
        </div>
        <div style={{ fontSize: 12, color: T.textMid }}>{title}</div>
      </div>
      <span className="tag" style={{ background: `${color}20`, color }}>
        {statusLabel(tone === 'success' ? 'in progress' : 'confirmed')}
      </span>
    </div>
  );
}

export default function Overview() {
  const { tokens: T } = useDashTheme();
  const qc = useQueryClient();
  const fetchOverview = useServerFn(ownerService.overview);
  const advance = useServerFn(ownerService.advance);
  const q = useQuery({ queryKey: ['overview'], queryFn: () => fetchOverview(), refetchInterval: 30000 });

  const advanceClock = async (minutes: 15 | 1440) => {
    try {
      await advance({ data: { minutes } });
      await qc.invalidateQueries({ queryKey: ['overview'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not advance the demo clock.');
    }
  };

  if (q.isPending) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up" style={{ color: T.textMid, textAlign: 'center', paddingTop: 80 }}>
          Loading overview…
        </div>
      </DashboardLayout>
    );
  }
  if (q.isError || !q.data) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up" style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ color: '#E53935', fontSize: 14, marginBottom: 12 }}>
            {q.error instanceof Error ? q.error.message : 'Data could not be loaded.'}
          </div>
          <button onClick={() => q.refetch()} className="btn-ghost px-4 py-2 rounded-lg text-sm">Try again</button>
        </div>
      </DashboardLayout>
    );
  }

  const d = q.data;
  const c = d.counts;
  const alerts = [
    c.review && { label: `${c.review} job${c.review > 1 ? 's need' : ' needs'} review`, count: c.review, href: '/dashboard/jobs', color: '#E53935' },
    c.assessment && { label: `${c.assessment} unusual request${c.assessment > 1 ? 's need' : ' needs'} assessment`, count: c.assessment, href: '/dashboard/jobs', color: '#F59E0B' },
    c.access && { label: `${c.access} appointment${c.access > 1 ? 's' : ''} need access confirmation`, count: c.access, href: '/dashboard/jobs', color: '#3B9AC4' },
    c.openSlots && { label: `${c.openSlots} cancelled slot${c.openSlots > 1 ? 's' : ''} can be recovered`, count: c.openSlots, href: '/dashboard/waitlist', color: '#0891B2' },
    c.projects && { label: `${c.projects} project${c.projects > 1 ? 's' : ''} awaiting your review`, count: c.projects, href: '/dashboard/projects', color: '#7B61FF' },
    c.abandoned && { label: `${c.abandoned} abandoned lead${c.abandoned > 1 ? 's' : ''} to recover`, count: c.abandoned, href: '/dashboard/leads', color: '#6DA8C4' },
  ].filter(Boolean) as { label: string; count: number; href: string; color: string }[];

  const nowMs = new Date(d.now).getTime();
  const items = d.today
    .filter(j => j.scheduled_at)
    .map(j => ({ key: j.id, time: fmtTime(j.scheduled_at!), title: j.title, customer: `${j.customer_name} · Zone ${j.zone}`, tone: statusTone(j.status), at: new Date(j.scheduled_at!).getTime() }))
    .concat([{ key: 'now', time: fmtTime(d.now), title: '', customer: '', tone: '', current: true, at: nowMs } as never])
    .sort((a, b) => (a as unknown as { at: number }).at - (b as unknown as { at: number }).at);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 md:mb-10 gap-4 flex-wrap">
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {fmtDay(d.now).toUpperCase()}
            </div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 300, color: T.text, lineHeight: 1.15 }}>
              Good morning, {d.ownerName.split(' ')[0]}.
            </h1>
          </div>
          {/* Demo clock control */}
          <div className="p-3 rounded-xl" style={{ background: 'rgba(8,145,178,0.06)', border: '1px dashed rgba(8,145,178,0.18)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#0891B2', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Demo clock</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 20, color: T.text, textAlign: 'center', marginBottom: 6 }}>
              {new Date(d.now).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => advanceClock(15)} className="flex-1 py-1 rounded text-xs" style={{ background: 'rgba(8,145,178,0.07)', color: T.textMid, border: 'none', cursor: 'pointer' }}>+15m</button>
              <button onClick={() => advanceClock(1440)} className="flex-1 py-1 rounded text-xs" style={{ background: 'rgba(8,145,178,0.07)', color: T.textMid, border: 'none', cursor: 'pointer' }}>+1d</button>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-6" style={{ background: T.card, border: '1px solid rgba(229,57,53,0.15)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Revenue at risk</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#E53935', lineHeight: 1 }}>
              {sek(d.revenueAtRisk)}
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>Unresolved opportunities</div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: T.card, border: '1px solid rgba(34,197,94,0.15)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Open capacity today</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 300, color: '#22C55E', lineHeight: 1 }}>
              {Math.floor(d.capacityMin / 60)}h {d.capacityMin % 60}m
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>Available work time</div>
          </div>
        </div>

        {/* Attention list */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 400, color: T.text }}>Needs your attention</h2>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, background: 'rgba(229,57,53,0.15)', color: '#E53935', borderRadius: 999, padding: '2px 8px' }}>
              {alerts.reduce((s, a) => s + a.count, 0)}
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-10" style={{ color: T.textDim, fontSize: 13 }}>Every inquiry has an outcome.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map(alert => (
                <Link key={alert.label} to={alert.href} className="flex items-center justify-between px-4 py-3 rounded-xl no-underline transition-all group"
                  style={{ background: T.card, border: `1px solid ${T.divider}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${alert.color}40`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.divider}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: alert.color }} />
                    <span style={{ fontSize: 14, color: T.text }}>{alert.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: alert.color, fontWeight: 600 }}>{alert.count}</span>
                    <span style={{ color: T.textDim, fontSize: 12 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 400, color: T.text }}>Today</h2>
            <Link to="/dashboard/calendar" style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#0891B2', textDecoration: 'none', letterSpacing: '0.06em' }}>
              Open calendar →
            </Link>
          </div>
          {d.today.length === 0 ? (
            <div className="text-center py-10" style={{ color: T.textDim, fontSize: 13 }}>No appointments today. Open time can be filled from the waitlist.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <TimelineBlock key={item.key} time={item.time} title={item.title} customer={item.customer} tone={item.tone} current={(item as any).current} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
