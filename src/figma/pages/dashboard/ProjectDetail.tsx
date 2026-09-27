// @ts-nocheck -- temporary until real data is wired
import { useState } from 'react';
import { Link, useParams } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { mockProjects } from '@/figma/data/mock';
import { useDashTheme } from '@/figma/context/DashTheme';

const DAY_COLORS: Record<string, string> = {
  done: '#22C55E',
  delayed: '#E53935',
  planned: '#0891B2',
  rest: 'rgba(8,145,178,0.08)',
};

const WORKFLOW_STAGES = ['Quoted', 'Deposit', 'In progress', 'Snagging', 'Complete', 'Invoiced'];

export default function ProjectDetail() {
  const { tokens: T } = useDashTheme();
  const { id } = useParams();
  const project = mockProjects.find(p => p.id === id) || mockProjects[0];
  const [workflowStage, setWorkflowStage] = useState('In progress');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayTasks, setDayTasks] = useState<Record<number, boolean[]>>(
    Object.fromEntries(project.days.map((d, i) => [i, d.tasks.map(() => false)]))
  );

  const toggleTask = (dayIdx: number, taskIdx: number) => {
    setDayTasks(dt => ({
      ...dt,
      [dayIdx]: dt[dayIdx]?.map((v, i) => i === taskIdx ? !v : v) || [],
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <Link to="/dashboard/projects" style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.textMid, textDecoration: 'none', display: 'block', marginBottom: 24 }}>
          ← All projects
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textMid, marginBottom: 4 }}>{project.ref}</div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: T.text, marginBottom: 4 }}>{project.name}</h1>
            <p style={{ fontSize: 13, color: T.textMid }}>{project.client} · {project.address}</p>
          </div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#0891B2', fontWeight: 300 }}>
            {project.budget.toLocaleString('sv-SE')} SEK
          </div>
        </div>

        {/* Workflow stages */}
        <div className="flex items-center mb-8 overflow-x-auto">
          {WORKFLOW_STAGES.map((stage, i) => {
            const active = stage === workflowStage;
            const done = WORKFLOW_STAGES.indexOf(workflowStage) > i;
            return (
              <div key={stage} className="flex items-center">
                <button
                  onClick={() => setWorkflowStage(stage)}
                  className="flex flex-col items-center transition-all"
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '8px 0' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all"
                    style={{
                      background: done ? '#0891B2' : active ? 'rgba(8,145,178,0.14)' : 'rgba(8,145,178,0.07)',
                      border: active ? '2px solid #0891B2' : done ? '2px solid #0891B2' : `2px solid ${T.cardBorder}`,
                      color: done ? '#030E1C' : active ? '#0891B2' : T.textMid,
                      fontFamily: 'JetBrains Mono',
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: active ? '#0891B2' : T.textDim, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {stage}
                  </span>
                </button>
                {i < WORKFLOW_STAGES.length - 1 && (
                  <div className="mx-1" style={{ width: 24, height: 2, background: done ? '#0891B2' : T.cardBorder, transition: 'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Day calendar */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: T.text, fontWeight: 400 }}>Site calendar</h3>
              <div className="flex gap-3">
                {Object.entries({ done: 'Done', delayed: 'Delay', planned: 'Planned', rest: 'Rest' }).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ background: DAY_COLORS[k] }} />
                    <span style={{ fontSize: 10, color: T.textDim, fontFamily: 'JetBrains Mono' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {project.days.length > 0 ? (
              <div className="flex flex-col gap-2">
                {project.days.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(selectedDay === i ? null : i)}
                    className="w-full text-left p-4 rounded-xl transition-all"
                    style={{
                      background: selectedDay === i ? 'rgba(8,145,178,0.08)' : T.cardAlt,
                      border: `1px solid ${selectedDay === i ? '#0891B2' : DAY_COLORS[day.status] + '30' || T.divider}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: DAY_COLORS[day.status] }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{day.title}</div>
                          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono' }}>{day.date}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: T.textDim }}>{selectedDay === i ? '▲' : '▼'}</span>
                    </div>

                    {selectedDay === i && (
                      <div className="mt-4 pt-4 animate-slide-up" style={{ borderTop: `1px solid ${T.divider}` }}>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Tasks</div>
                        {day.tasks.map((task, ti) => (
                          <div
                            key={ti}
                            className="flex items-center gap-3 py-2 cursor-pointer"
                            onClick={e => { e.stopPropagation(); toggleTask(i, ti); }}
                          >
                            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                background: dayTasks[i]?.[ti] ? '#0891B2' : T.divider,
                                border: `1px solid ${dayTasks[i]?.[ti] ? '#0891B2' : T.cardBorder}`,
                              }}>
                              {dayTasks[i]?.[ti] && <span style={{ fontSize: 10, color: '#030E1C' }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 13, color: dayTasks[i]?.[ti] ? T.textDim : T.text, textDecoration: dayTasks[i]?.[ti] ? 'line-through' : 'none' }}>
                              {task}
                            </span>
                          </div>
                        ))}
                        <button className="btn-copper w-full py-2.5 rounded-lg text-sm font-semibold mt-4">
                          Save day ✓
                        </button>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: T.textDim }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>▣</div>
                <div style={{ fontSize: 14 }}>No days planned yet</div>
              </div>
            )}
          </div>

          {/* Actions panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: T.text, marginBottom: 14, fontWeight: 400 }}>Schedule</h4>
              <div className="flex flex-col gap-3">
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Site name</label>
                  <input className="vvs-input" defaultValue={project.name.split(' ')[0]} style={{ background: T.input }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Start date</label>
                  <input type="date" className="vvs-input" defaultValue={project.startDate} style={{ background: T.input }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Working days</label>
                  <input type="number" className="vvs-input" defaultValue={project.days.length || 5} style={{ background: T.input }} />
                </div>
                <button className="btn-copper w-full py-3 rounded-xl text-sm font-semibold">
                  Plan {project.days.length || 5} working days →
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: T.text, marginBottom: 14, fontWeight: 400 }}>Delay management</h4>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3].map(n => (
                  <button key={n} className="flex-1 py-2 rounded-lg text-sm transition-all"
                    style={{ background: 'rgba(229,57,53,0.08)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)', cursor: 'pointer' }}>
                    +{n}d
                  </button>
                ))}
              </div>
              <button className="btn-ghost w-full py-2.5 rounded-lg text-sm mb-2">
                Work a rest day
              </button>
              <button className="w-full py-2.5 rounded-lg text-sm transition-all" style={{ background: 'rgba(74,85,104,0.1)', color: T.textDim, border: `1px solid rgba(74,85,104,0.2)`, cursor: 'pointer' }}>
                Reset plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
