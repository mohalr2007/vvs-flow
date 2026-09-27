import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { useDashTheme } from '@/figma/context/DashTheme';
import { jobService } from '@/lib/services';
import { fmtShortDay, fmtTime, sameStockholmDay, stockholmParts } from '@/lib/time';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00–18:00
const START = 7, END = 18;

const STATUS_COLOR: Record<string, string> = {
  cancelled: '#E53935',
  access_confirmed: '#22C55E',
  in_progress: '#22C55E',
  confirmed: '#F59E0B',
};
const colorFor = (status: string) => STATUS_COLOR[status] || '#3B9AC4';

export default function CalendarPage() {
  const { tokens: T } = useDashTheme();
  const [view, setView] = useState<'day' | 'week'>('week');
  const [selectedDay, setSelectedDay] = useState(0);
  const [offset, setOffset] = useState(0);

  const cal = useServerFn(jobService.calendar);
  const q = useQuery({ queryKey: ['calendar', offset], queryFn: () => cal({ data: { offsetDays: offset } }) });

  const goPrev = () => setOffset(o => o - (view === 'week' ? 7 : 1));
  const goNext = () => setOffset(o => o + (view === 'week' ? 7 : 1));
  const goToday = () => setOffset(0);

  const d = q.data;
  const days = d ? Array.from({ length: view === 'week' ? 5 : 1 }, (_, i) => new Date(new Date(d.from).getTime() + i * 86400000 + 3600000 * 12)) : [];
  const now = d ? new Date(d.now) : new Date();
  const dayLabels = days.map(day => fmtShortDay(day));

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 300, color: T.text, marginBottom: 4 }}>Calendar</h1>
            <p style={{ fontSize: 13, color: T.textMid }}>{days.length ? `${fmtShortDay(days[0]!)} – ${fmtShortDay(days[days.length - 1]!)}` : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goPrev} className="btn-ghost px-3 py-2 rounded-lg text-sm">← Prev</button>
            <button onClick={goToday} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(8,145,178,0.1)', color: '#0891B2', border: `1px solid ${T.cardBorderStrong}`, cursor: 'pointer' }}>Today</button>
            <button onClick={goNext} className="btn-ghost px-3 py-2 rounded-lg text-sm">Next →</button>
            <div className="flex gap-1 ml-2 p-1 rounded-lg" style={{ background: T.input, border: `1px solid ${T.cardBorder}` }}>
              {(['day', 'week'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
                  style={{
                    background: view === v ? 'rgba(8,145,178,0.14)' : 'transparent',
                    color: view === v ? '#0891B2' : T.textMid,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-5 flex-wrap">
          {[
            { color: '#E53935', label: 'Cancelled' },
            { color: '#F59E0B', label: 'Confirmed' },
            { color: '#22C55E', label: 'Access confirmed' },
            { color: '#3B9AC4', label: 'Other' },
            { color: '#7B61FF', label: 'Project task' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              <span style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.04em' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Day selector for day view */}
        {view === 'day' && days.length > 0 && (
          <div className="flex gap-2 mb-5">
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className="flex-1 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: selectedDay === i ? 'rgba(8,145,178,0.12)' : 'rgba(8,145,178,0.04)',
                  color: selectedDay === i ? '#0891B2' : T.textMid,
                  border: `1px solid ${selectedDay === i ? 'rgba(8,145,178,0.3)' : T.divider}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600 }}>{fmtShortDay(day)}</div>
              </button>
            ))}
          </div>
        )}

        {/* Calendar grid */}
        <div className="rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
          {q.isPending ? (
            <div className="p-10 text-center" style={{ color: T.textDim, fontSize: 14 }}>Loading calendar…</div>
          ) : q.isError || !d ? (
            <div className="p-10 text-center">
              <div style={{ color: '#E53935', fontSize: 14, marginBottom: 12 }}>{q.error instanceof Error ? q.error.message : 'Calendar could not be loaded.'}</div>
              <button onClick={() => q.refetch()} className="btn-ghost px-4 py-2 rounded-lg text-sm">Try again</button>
            </div>
          ) : (
            <>
              {/* Day headers (week view) */}
              {view === 'week' && (
                <div className="grid border-b" style={{ gridTemplateColumns: '56px repeat(5, 1fr)', borderColor: T.cardBorder }}>
                  <div />
                  {days.map((day, i) => (
                    <div key={i} className="py-3 text-center" style={{ borderLeft: `1px solid ${T.divider}` }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dayLabels[i]!.split(' ')[0]}</div>
                      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: sameStockholmDay(day, now) ? '#0891B2' : T.text, fontWeight: 300 }}>{dayLabels[i]!.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Time grid */}
              <div className="relative" style={{ overflowY: 'auto', maxHeight: 600 }}>
                <div style={{ display: 'grid', gridTemplateColumns: view === 'week' ? '56px repeat(5, 1fr)' : '56px 1fr', position: 'relative' }}>
                  {/* Hour labels */}
                  <div className="relative">
                    {HOURS.map(h => (
                      <div key={h} style={{ height: 55, display: 'flex', alignItems: 'flex-start', paddingTop: 4, paddingRight: 8, justifyContent: 'flex-end' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textDim }}>{h}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {(view === 'week' ? days : [days[selectedDay]]).map((day, dayIdx) => {
                    if (!day) return null;
                    const realIdx = view === 'week' ? dayIdx : selectedDay;
                    const isRestDay = (d.restDays ?? []).includes(day.getUTCDay());
                    const dayJobs = d.jobs.filter(j => j.scheduled_at && sameStockholmDay(new Date(j.scheduled_at), day));
                    const p = stockholmParts(day);
                    const key = `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
                    const dayTasks = d.tasks.filter(t => t.work_date === key);
                    return (
                      <div key={realIdx} className="relative" style={{ borderLeft: `1px solid ${T.divider}`, background: isRestDay ? 'rgba(74,85,104,0.06)' : undefined }}>
                        {HOURS.map(h => (
                          <div key={h} style={{ height: 55, borderBottom: `1px solid rgba(8,145,178,0.04)` }} />
                        ))}

                        {/* Jobs */}
                        {dayJobs.map(j => {
                          const jp = stockholmParts(new Date(j.scheduled_at!));
                          const top = ((jp.h - START) * 60 + jp.mi) / 60 / (END - START) * 100;
                          const height = j.duration_min / 60 / (END - START) * 100;
                          const color = colorFor(j.status);
                          return (
                            <Link
                              key={j.id}
                              to={`/dashboard/jobs/${j.id}`}
                              className="absolute left-1 right-1 rounded-lg overflow-hidden transition-all no-underline"
                              style={{
                                top: `${top}%`,
                                height: `${height}%`,
                                background: `${color}22`,
                                border: `1px solid ${color}44`,
                                cursor: 'pointer',
                                minHeight: 22,
                                textDecoration: j.status === 'cancelled' ? 'line-through' : 'none',
                              }}
                            >
                              <div className="flex items-center gap-1 px-2 py-1" style={{ height: '100%' }}>
                                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
                                <div style={{ overflow: 'hidden' }}>
                                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {j.customer_name}
                                  </div>
                                  <div style={{ fontSize: 9, color: T.textMid }}>{j.title}</div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}

                        {/* Project tasks */}
                        {dayTasks.map(t => {
                          const s = Math.max(START, t.start_hour), e = Math.min(END, t.end_hour);
                          if (e <= s) return null;
                          const top = (s - START) / (END - START) * 100;
                          const height = (e - s) / (END - START) * 100;
                          return (
                            <div
                              key={t.id}
                              className="absolute left-1/3 right-1 rounded-lg overflow-hidden"
                              style={{ top: `${top}%`, height: `${height}%`, background: 'rgba(123,97,255,0.16)', border: '1px solid rgba(123,97,255,0.4)', opacity: t.done ? 0.6 : 1, minHeight: 20 }}
                            >
                              <div className="px-2 py-1" style={{ fontSize: 9, color: '#7B61FF', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.title}
                              </div>
                            </div>
                          );
                        })}

                        {/* Current time line */}
                        {sameStockholmDay(day, now) && (() => {
                          const npos = stockholmParts(now);
                          if (npos.h < START || npos.h >= END) return null;
                          const top = ((npos.h - START) * 60 + npos.mi) / 60 / (END - START) * 100;
                          return (
                            <div className="absolute left-0 right-0" style={{ top: `${top}%`, height: 2, background: '#E53935', zIndex: 10, boxShadow: '0 0 8px rgba(229,57,53,0.6)' }}>
                              <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full" style={{ background: '#E53935' }} />
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
              {d.jobs.length === 0 && d.tasks.length === 0 && (
                <div className="p-4 text-center" style={{ fontSize: 13, color: T.textDim }}>No appointments in this period.</div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
