import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Link, useParams } from '@/figma/router';
import DashboardLayout from '@/figma/components/DashboardLayout';
import { ProjectQuote } from '@/figma/components/ProjectQuote';
import { useDashTheme } from '@/figma/context/DashTheme';
import { projectService } from '@/lib/services';
import { PROJECT_STEPS, statusLabel, type ProjectStatus } from '@/lib/vvs-data';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Nothing has been changed.');

type Item = { text: string; done: boolean };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

export default function ProjectDetail() {
  const { tokens: T } = useDashTheme();
  const { id } = useParams();
  const get = useServerFn(projectService.get);
  const plan = useServerFn(projectService.plan);
  const extend = useServerFn(projectService.extend);
  const toggleRest = useServerFn(projectService.toggleRestDay);
  const resetPlan = useServerFn(projectService.resetPlan);
  const setStatus = useServerFn(projectService.setStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['project', id], queryFn: () => get({ data: { id: id! } }), enabled: !!id });

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['project', id] }), qc.invalidateQueries({ queryKey: ['projects'] })]);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); await refresh(); if (ok) toast.success(ok); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const [planForm, setPlanForm] = useState({ title: 'Site work', startDate: iso(new Date()), days: 10 });
  const [ext, setExt] = useState({ days: 1, reason: '' });
  const [selected, setSelected] = useState<string | null>(null);

  if (!id) return <DashboardLayout><div className="p-4 md:p-8 max-w-5xl mx-auto" style={{ color: '#E53935' }}>No project selected.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-up">
        <Link to="/dashboard/projects" style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: T.textMid, textDecoration: 'none', display: 'block', marginBottom: 24 }}>
          ← All projects
        </Link>

        {q.isPending ? (
          <p style={{ fontSize: 13, color: T.textMid }}>Loading project…</p>
        ) : q.isError || !q.data ? (
          <div>
            <p style={{ fontSize: 13, color: '#E53935' }}>{q.error instanceof Error ? q.error.message : 'Project could not be loaded.'}</p>
            <button onClick={() => q.refetch()} className="btn-water mt-3 px-4 py-2 rounded-lg text-sm">Try again</button>
          </div>
        ) : (
          <ProjectBody
            data={q.data}
            planForm={planForm} setPlanForm={setPlanForm}
            ext={ext} setExt={setExt}
            selected={selected} setSelected={setSelected}
            run={run}
            plan={plan} extend={extend} toggleRest={toggleRest} resetPlan={resetPlan} setStatus={setStatus}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

type ProjectData = Awaited<ReturnType<typeof projectService.get>>;

function ProjectBody({ data, planForm, setPlanForm, ext, setExt, selected, setSelected, run, plan, extend, toggleRest, resetPlan, setStatus }: {
  data: ProjectData;
  planForm: { title: string; startDate: string; days: number };
  setPlanForm: React.Dispatch<React.SetStateAction<{ title: string; startDate: string; days: number }>>;
  ext: { days: number; reason: string };
  setExt: React.Dispatch<React.SetStateAction<{ days: number; reason: string }>>;
  selected: string | null;
  setSelected: React.Dispatch<React.SetStateAction<string | null>>;
  run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
  plan: ReturnType<typeof useServerFn<typeof projectService.plan>>;
  extend: ReturnType<typeof useServerFn<typeof projectService.extend>>;
  toggleRest: ReturnType<typeof useServerFn<typeof projectService.toggleRestDay>>;
  resetPlan: ReturnType<typeof useServerFn<typeof projectService.resetPlan>>;
  setStatus: ReturnType<typeof useServerFn<typeof projectService.setStatus>>;
}) {
  const { tokens: T } = useDashTheme();
  const { project: p, tasks, restDays = [0, 6], workStart = 8, workEnd = 17 } = data;
  const planned = tasks.length > 0;
  const byDate = new Map(tasks.map(t => [t.work_date, t]));
  const base = tasks.filter(t => !t.is_extension).length, extraDays = tasks.length - base;
  const doneCount = tasks.filter(t => t.done).length;
  const first = tasks[0]?.work_date, last = tasks[tasks.length - 1]?.work_date;
  const i = PROJECT_STEPS.indexOf(p.status);
  const sel = selected ? byDate.get(selected) : undefined;

  return (
    <>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: T.textMid, marginBottom: 4 }}>{p.ref}</div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 300, color: T.text, marginBottom: 4 }}>{p.title}</h1>
          <p style={{ fontSize: 13, color: T.textMid }}>{p.customer_name} · {p.address ?? 'Address pending'}</p>
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, color: '#0891B2', fontWeight: 300 }}>{p.budget}</div>
      </div>

      {/* Workflow stages */}
      <div className="flex items-center mb-8 overflow-x-auto">
        {PROJECT_STEPS.map((s, k) => {
          const active = s === p.status;
          const done = k < i;
          return (
            <div key={s} className="flex items-center">
              <button
                onClick={() => run(() => setStatus({ data: { id: p.id, status: s as ProjectStatus } }))}
                className="flex flex-col items-center transition-all"
                style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '8px 0' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all"
                  style={{
                    background: done ? '#0891B2' : active ? 'rgba(8,145,178,0.14)' : 'rgba(8,145,178,0.07)',
                    border: active || done ? '2px solid #0891B2' : `2px solid ${T.cardBorder}`,
                    color: done ? '#030E1C' : active ? '#0891B2' : T.textMid,
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  {done ? '✓' : k + 1}
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: active ? '#0891B2' : T.textDim, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                  {statusLabel(s)}
                </span>
              </button>
              {k < PROJECT_STEPS.length - 1 && (
                <div className="mx-1" style={{ width: 24, height: 2, background: done ? '#0891B2' : T.cardBorder, transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {p.description && (
        <div className="p-5 rounded-2xl mb-6" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
          {p.phone && <a href={`tel:${p.phone}`} style={{ fontSize: 13, color: T.textMid, marginRight: 16 }}>{p.phone}</a>}
          <p className="mt-2 whitespace-pre-wrap" style={{ fontSize: 13, color: T.textMid }}>{p.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Day calendar */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: T.text, fontWeight: 400 }}>Site calendar</h3>
            <p style={{ fontSize: 12, color: T.textMid }}>
              {planned ? `${base} planned day${base === 1 ? '' : 's'}${extraDays ? ` + ${extraDays} delay` : ''} · ${doneCount}/${tasks.length} done · ${fmtDate(first!)} → ${fmtDate(last!)}` : 'Not planned yet'}
            </p>
          </div>

          {planned ? (
            <div className="flex flex-col gap-2">
              {tasks.map((t, n) => {
                const items = (t.checklist as Item[] | null) ?? [];
                const openN = items.filter(x => !x.done).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(selected === t.work_date ? null : t.work_date)}
                    className="w-full text-left p-4 rounded-xl transition-all"
                    style={{
                      background: selected === t.work_date ? 'rgba(8,145,178,0.08)' : T.cardAlt,
                      border: `1px solid ${selected === t.work_date ? '#0891B2' : t.done ? 'rgba(34,197,94,0.3)' : t.is_extension ? 'rgba(245,158,11,0.3)' : T.divider}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: t.done ? '#22C55E' : t.is_extension ? '#F59E0B' : '#0891B2' }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono' }}>{fmtDate(t.work_date)} · {hh(t.start_hour)}–{hh(t.end_hour)}{openN ? ` · ${openN} to do` : ''}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color: T.textDim }}>{selected === t.work_date ? '▲' : '▼'}</span>
                    </div>

                    {selected === t.work_date && (
                      <div onClick={e => e.stopPropagation()}>
                        <DayEditor task={t} worked={(p.worked_rest_dates ?? []).includes(t.work_date)} onRestore={() => run(() => toggleRest({ data: { projectId: p.id, date: t.work_date } }), 'Rest day restored — schedule updated')} onClose={() => setSelected(null)} run={run} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12" style={{ color: T.textDim }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>▣</div>
              <div style={{ fontSize: 14 }}>No days planned yet</div>
            </div>
          )}

          <div className="mt-6">
            <ProjectQuote key={p.id} projectId={p.id} initial={p.quote} />
          </div>
        </div>

        {/* Actions panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {!planned ? (
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: T.text, marginBottom: 6, fontWeight: 400 }}>Plan the site</h4>
              <p style={{ fontSize: 12, color: T.textMid, marginBottom: 14 }}>
                Rest days ({restDays.length ? restDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') : 'none'}) are skipped, hours {hh(workStart)}–{hh(workEnd)}.
              </p>
              <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); void run(() => plan({ data: { projectId: p.id, ...planForm } }), `${planForm.days} working days planned`); }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Site name</label>
                  <input className="vvs-input" value={planForm.title} maxLength={120} required onChange={e => setPlanForm(f => ({ ...f, title: e.target.value }))} style={{ background: T.input }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Start date</label>
                  <input type="date" className="vvs-input" required value={planForm.startDate} onChange={e => setPlanForm(f => ({ ...f, startDate: e.target.value }))} style={{ background: T.input }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: T.textMid, fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>Working days</label>
                  <input type="number" min={1} max={120} className="vvs-input" value={planForm.days} onChange={e => setPlanForm(f => ({ ...f, days: Math.max(1, Math.min(120, Number(e.target.value) || 1)) }))} style={{ background: T.input }} />
                </div>
                <button type="submit" className="btn-copper w-full py-3 rounded-xl text-sm font-semibold">
                  Plan {planForm.days} working day{planForm.days === 1 ? '' : 's'} →
                </button>
              </form>
            </div>
          ) : (
            <div className="p-5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.cardBorder}` }}>
              <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: 15, color: T.text, marginBottom: 14, fontWeight: 400 }}>Delay management</h4>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setExt(x => ({ ...x, days: n }))} className="flex-1 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: ext.days === n ? 'rgba(229,57,53,0.14)' : 'rgba(229,57,53,0.06)',
                      color: '#E53935',
                      border: `1px solid ${ext.days === n ? '#E53935' : 'rgba(229,57,53,0.2)'}`,
                      cursor: 'pointer',
                    }}>
                    +{n}d
                  </button>
                ))}
              </div>
              <input className="vvs-input mb-3" placeholder="Reason (e.g. parts delivery late)" maxLength={300} value={ext.reason} onChange={e => setExt(x => ({ ...x, reason: e.target.value }))} style={{ background: T.input }} />
              <button onClick={() => run(() => extend({ data: { projectId: p.id, ...ext } }), `${ext.days} delay day${ext.days === 1 ? '' : 's'} added`).then(() => setExt({ days: 1, reason: '' }))} className="btn-ghost w-full py-2.5 rounded-lg text-sm mb-2">
                + Add {ext.days} delay day{ext.days === 1 ? '' : 's'}
              </button>
              <button
                onClick={() => { if (confirm('Delete the whole site plan, including daily tasks?')) run(() => resetPlan({ data: { id: p.id } }), 'Plan reset'); }}
                className="w-full py-2.5 rounded-lg text-sm transition-all"
                style={{ background: 'rgba(74,85,104,0.1)', color: T.textDim, border: `1px solid rgba(74,85,104,0.2)`, cursor: 'pointer' }}
              >
                Reset plan
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type Task = ProjectData['tasks'][number];
function DayEditor({ task, worked, onRestore, onClose, run }: { task: Task; worked: boolean; onRestore: () => void; onClose: () => void; run: (fn: () => Promise<unknown>, ok?: string) => Promise<void> }) {
  const { tokens: T } = useDashTheme();
  const update = useServerFn(projectService.updateTask);
  const [f, setF] = useState({ title: task.title, notes: task.notes, start_hour: task.start_hour, end_hour: task.end_hour, done: task.done, checklist: ((task.checklist as Item[] | null) ?? []) });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF({ title: task.title, notes: task.notes, start_hour: task.start_hour, end_hour: task.end_hour, done: task.done, checklist: ((task.checklist as Item[] | null) ?? []) }); }, [task]);

  const save = async () => {
    setBusy(true);
    try { await update({ data: { id: task.id, ...f } }); await run(async () => {}, 'Day saved'); }
    finally { setBusy(false); }
  };
  const add = () => { const t = draft.trim(); if (!t) return; setF({ ...f, checklist: [...f.checklist, { text: t, done: false }] }); setDraft(''); };

  return (
    <div className="mt-4 pt-4 animate-slide-up" style={{ borderTop: `1px solid ${T.divider}` }}>
      <div className="flex items-start justify-between mb-3">
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: T.textMid, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Tasks {task.is_extension ? '· Delay day' : ''}{worked ? '· Rest day worked' : ''}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
      <input className="vvs-input mb-2" value={f.title} maxLength={120} onChange={e => setF({ ...f, title: e.target.value })} style={{ background: T.input }} />
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input type="number" min={0} max={23} className="vvs-input" value={f.start_hour} onChange={e => setF({ ...f, start_hour: Number(e.target.value) })} style={{ background: T.input }} />
        <input type="number" min={1} max={24} className="vvs-input" value={f.end_hour} onChange={e => setF({ ...f, end_hour: Number(e.target.value) })} style={{ background: T.input }} />
      </div>
      {f.checklist.map((it, ti) => (
        <div key={ti} className="flex items-center gap-3 py-1.5">
          <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all cursor-pointer"
            onClick={() => setF({ ...f, checklist: f.checklist.map((x, k) => k === ti ? { ...x, done: !x.done } : x) })}
            style={{ background: it.done ? '#0891B2' : T.divider, border: `1px solid ${it.done ? '#0891B2' : T.cardBorder}` }}>
            {it.done && <span style={{ fontSize: 10, color: '#030E1C' }}>✓</span>}
          </div>
          <span className="flex-1" style={{ fontSize: 13, color: it.done ? T.textDim : T.text, textDecoration: it.done ? 'line-through' : 'none' }}>{it.text}</span>
          <button onClick={() => setF({ ...f, checklist: f.checklist.filter((_, k) => k !== ti) })} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <div className="flex gap-2 mt-2 mb-3">
        <input className="vvs-input" placeholder="e.g. Remove old bathtub" maxLength={200} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} style={{ background: T.input }} />
        <button onClick={add} className="btn-ghost px-3 rounded-lg text-sm">+</button>
      </div>
      <textarea className="vvs-input mb-3" rows={3} maxLength={1000} placeholder="Materials to bring, access, contacts…" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} style={{ background: T.input, resize: 'vertical' }} />
      <label className="flex items-center gap-2 mb-3" style={{ fontSize: 13, color: T.text }}>
        <input type="checkbox" checked={f.done} onChange={e => setF({ ...f, done: e.target.checked })} /> Day completed
      </label>
      <button onClick={save} disabled={busy || f.end_hour <= f.start_hour} className="btn-copper w-full py-2.5 rounded-lg text-sm font-semibold mb-2" style={{ opacity: busy || f.end_hour <= f.start_hour ? 0.6 : 1 }}>
        {busy ? 'Saving…' : 'Save day ✓'}
      </button>
      <div className="flex flex-wrap gap-2">
        {worked && <button onClick={onRestore} className="btn-ghost px-3 py-1.5 rounded-lg text-xs">Restore rest day</button>}
        {task.is_extension && (
          <button
            onClick={async () => { try { await update({ data: { id: task.id, remove: true } }); await run(async () => {}, 'Delay day removed'); onClose(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not remove day.'); } }}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(229,57,53,0.08)', color: '#E53935', border: '1px solid rgba(229,57,53,0.2)', cursor: 'pointer' }}
          >
            Remove delay day
          </button>
        )}
      </div>
    </div>
  );
}
