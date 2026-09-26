import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { ProjectQuote } from "@/components/vvs/project-quote";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { projectService } from "@/lib/services";
import { PROJECT_STEPS, statusLabel, type ProjectStatus } from "@/lib/vvs-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/projects_/$projectId")({
  head: () => ({ meta: [{ title: "Project details — VVS Flow" }, { name: "description", content: "Project details, site calendar, daily tasks and quote." }, { property: "og:title", content: "Project details — VVS Flow" }, { property: "og:description", content: "Plan every working day of a plumbing project." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProjectDetail,
});

type Item = { text: string; done: boolean };
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dow = (s: string) => new Date(s + "T12:00:00").getDay();
const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const get = useServerFn(projectService.get), plan = useServerFn(projectService.plan), extend = useServerFn(projectService.extend), toggleRest = useServerFn(projectService.toggleRestDay), resetPlan = useServerFn(projectService.resetPlan), setStatus = useServerFn(projectService.setStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["project", projectId], queryFn: () => get({ data: { id: projectId } }) });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["project", projectId] }), qc.invalidateQueries({ queryKey: ["projects"] }), qc.invalidateQueries({ queryKey: ["calendar"] })]);
  const run = async (fn: () => Promise<unknown>, ok?: string) => { try { await fn(); await refresh(); if (ok) toast.success(ok); } catch (e) { toast.error(errMsg(e)); } };

  const [planForm, setPlanForm] = useState({ title: "Site work", startDate: iso(new Date()), days: 10 });
  const [ext, setExt] = useState({ days: 1, reason: "" });
  const [month, setMonth] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" asChild><Link to="/dashboard/projects"><ArrowLeft/>All projects</Link></Button>
    <QueryState q={q}>{({ project: p, tasks, restDays = [0, 6], workStart = 8, workEnd = 17 }) => {
      const planned = tasks.length > 0;
      const byDate = new Map(tasks.map(t => [t.work_date, t]));
      const last = tasks[tasks.length - 1]?.work_date;
      const base = tasks.filter(t => !t.is_extension).length, extra = tasks.length - base;
      const doneCount = tasks.filter(t => t.done).length;
      const m = month ?? (() => { const d = new Date((p.start_date ?? iso(new Date())) + "T12:00:00"); return new Date(d.getFullYear(), d.getMonth(), 1); })();
      const lead = (m.getDay() + 6) % 7, dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      const cells = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => new Date(m.getFullYear(), m.getMonth(), i + 1))];
      const today = iso(new Date());
      const inSpan = (k: string) => !!p.start_date && !!last && k >= p.start_date && k <= last;
      const isRest = (k: string) => restDays.includes(dow(k));
      const sel = selected ? byDate.get(selected) : undefined;
      const selRest = selected && !sel && isRest(selected) && inSpan(selected);
      const restLabel = restDays.length ? [1, 2, 3, 4, 5, 6, 0].filter(d => restDays.includes(d)).map(d => DAY[d]).join(", ") : "none";

      return <>
        <PageHeader title={p.title} description={`${p.customer_name} · ${p.ref} · Budget ${p.budget}`} action={<StatusBadge tone={p.status === "completed" || p.status === "project_approved" ? "success" : p.status === "owner_review" ? "warning" : "info"}>{statusLabel(p.status)}</StatusBadge>}/>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">
            <Card className="rounded-md p-5 shadow-none"><h2 className="font-bold">Project details</h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{p.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground"/>{p.phone}</a>}{p.address && <span className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground"/>{p.address}</span>}</div>
              {p.description && <p className="mt-4 whitespace-pre-wrap text-sm">{p.description}</p>}
              <h3 className="mt-6 text-sm font-semibold">Workflow stage</h3>
              <div className="mt-3 flex flex-wrap gap-2">{PROJECT_STEPS.map((s, k) => <button key={s} onClick={() => run(() => setStatus({ data: { id: p.id, status: s as ProjectStatus } }))} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", s === p.status ? "border-copper bg-copper text-background" : k < PROJECT_STEPS.indexOf(p.status) ? "border-copper/40 bg-copper/10" : "hover:bg-muted")}>{statusLabel(s)}</button>)}</div>
            </Card>

            <Card className="rounded-md p-5 shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Site calendar</h2><p className="text-sm text-muted-foreground">{planned ? `${base} planned day${base === 1 ? "" : "s"}${extra ? ` + ${extra} delay` : ""} · ${doneCount}/${tasks.length} done · ${fmtDate(p.start_date!)} → ${fmtDate(last!)}` : "Not planned yet"}</p></div>
                <div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft/></Button><span className="min-w-32 text-center text-sm font-semibold">{m.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span><Button size="icon" variant="outline" aria-label="Next month" onClick={() => setMonth(new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight/></Button></div></div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <span key={d}>{d}</span>)}</div>
              <div className="mt-1 grid grid-cols-7 gap-1">{cells.map((c, i) => {
                if (!c) return <div key={i}/>;
                const k = iso(c), t = byDate.get(k), rest = isRest(k), worked = (p.worked_rest_dates ?? []).includes(k);
                const clickable = !!t || (rest && inSpan(k)) || !planned;
                const open = t ? ((t.checklist as Item[] | null) ?? []).filter(x => !x.done).length : 0;
                return <button key={k} disabled={!clickable} onClick={() => planned ? setSelected(k) : setPlanForm(f => ({ ...f, startDate: k }))} className={cn("min-h-16 rounded-md border p-1.5 text-left text-xs transition-colors enabled:hover:border-copper disabled:cursor-default",
                  rest && !t && "bg-[repeating-linear-gradient(135deg,var(--muted)_0_6px,transparent_6px_12px)] text-muted-foreground",
                  t && (t.done ? "border-success/50 bg-success/10" : t.is_extension ? "border-warning/60 bg-warning/12" : "border-copper/50 bg-copper/12"),
                  (selected === k || (!planned && planForm.startDate === k)) && "ring-2 ring-primary", k === today && "font-bold text-primary")}>
                  <span>{c.getDate()}</span>
                  {t && <p className="mt-1 text-[10px] leading-tight text-foreground">{t.start_hour}–{t.end_hour}h{worked && " · rest"}{open ? ` · ${open} to do` : ""}</p>}
                  {!t && rest && inSpan(k) && <p className="mt-1 text-[10px] leading-tight">Rest day</p>}
                </button>;
              })}</div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><Legend c="bg-copper/30">Planned day</Legend><Legend c="bg-warning/40">Delay day</Legend><Legend c="bg-success/40">Done</Legend><Legend c="bg-muted">Rest day ({restLabel})</Legend></div>
              <p className="mt-2 text-xs text-muted-foreground">{planned ? "Click a working day to write its tasks. Click a rest day inside the site period to work it — the schedule shifts automatically." : "Click a day to choose the start date."} Rest days and hours come from Settings.</p>
            </Card>

            {planned && <Card className="rounded-md p-5 shadow-none"><h2 className="font-bold">Working days</h2>
              <ul className="mt-3 divide-y">{tasks.map((t, n) => { const items = t.checklist as Item[]; return <li key={t.id}><button onClick={() => { setSelected(t.work_date); const d = new Date(t.work_date + "T12:00:00"); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }} className={cn("flex w-full items-center gap-3 py-2.5 text-left hover:bg-muted/50", selected === t.work_date && "bg-muted/60")}><span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold", t.done && "border-success bg-success text-background", t.is_extension && !t.done && "border-warning")}>{t.done ? <Check className="size-4"/> : n + 1}</span><div className="min-w-0 flex-1"><p className={cn("truncate text-sm font-semibold", t.done && "line-through opacity-60")}>{t.title}</p><p className="text-xs text-muted-foreground">{fmtDate(t.work_date)} · {hh(t.start_hour)}–{hh(t.end_hour)}{items.length ? ` · ${items.filter(x => x.done).length}/${items.length} tasks` : ""}{(p.worked_rest_dates ?? []).includes(t.work_date) && " · rest day worked"}</p></div></button></li>; })}</ul>
            </Card>}

            <ProjectQuote key={p.id} projectId={p.id} initial={p.quote}/>
          </div>

          <div className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            {!planned ? <Card className="rounded-md p-5 shadow-none"><h2 className="flex items-center gap-2 font-bold"><CalendarPlus className="size-5 text-copper"/>Plan the site</h2>
              <p className="mt-1 text-sm text-muted-foreground">Set the length once. Rest days ({restLabel}) are skipped and each day uses your hours {hh(workStart)}–{hh(workEnd)}.</p>
              <form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); void run(() => plan({ data: { projectId: p.id, ...planForm } }), `${planForm.days} working days planned`); }}>
                <div className="space-y-1.5"><Label htmlFor="t">Site name</Label><Input id="t" value={planForm.title} maxLength={120} required onChange={e => setPlanForm({ ...planForm, title: e.target.value })}/></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="sd">Start date</Label><Input id="sd" type="date" required value={planForm.startDate} onChange={e => setPlanForm({ ...planForm, startDate: e.target.value })}/></div><div className="space-y-1.5"><Label htmlFor="nd">Working days</Label><Input id="nd" type="number" min={1} max={120} value={planForm.days} onChange={e => setPlanForm({ ...planForm, days: Math.max(1, Math.min(120, Number(e.target.value) || 1)) })}/></div></div>
                <Button type="submit" className="w-full">Plan {planForm.days} working day{planForm.days === 1 ? "" : "s"}</Button>
              </form></Card>
            : <>
              {sel ? <DayEditor key={sel.id} task={sel} worked={(p.worked_rest_dates ?? []).includes(sel.work_date)} onRestore={() => run(() => toggleRest({ data: { projectId: p.id, date: sel.work_date } }), "Rest day restored — schedule updated")} onClose={() => setSelected(null)} onSaved={refresh}/>
              : selRest ? <Card className="rounded-md p-5 shadow-none"><div className="flex items-start justify-between"><h2 className="font-bold">{fmtDate(selected!)} · Rest day</h2><Button size="icon" variant="ghost" aria-label="Close" onClick={() => setSelected(null)}><X/></Button></div><p className="mt-2 text-sm text-muted-foreground">This is one of your rest days, so the site skips it. Work it to finish sooner — every following day moves one day earlier.</p><Button className="mt-4 w-full" onClick={() => run(() => toggleRest({ data: { projectId: p.id, date: selected! } }), "Rest day will be worked — schedule updated")}>Work this rest day</Button></Card>
              : <Card className="rounded-md border-dashed p-5 text-sm text-muted-foreground shadow-none">Select a day in the calendar to write what needs to be done that day.</Card>}

              <Card className="rounded-md p-5 shadow-none"><h2 className="flex items-center gap-2 font-bold"><Clock className="size-5 text-warning"/>Delay days</h2>
                <p className="mt-1 text-sm text-muted-foreground">Running late? Add 1–5 days at the end. Rest days are still respected.</p>
                <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); void run(() => extend({ data: { projectId: p.id, ...ext } }), `${ext.days} delay day${ext.days === 1 ? "" : "s"} added`).then(() => setExt({ days: 1, reason: "" })); }}>
                  <div className="flex gap-1" role="group" aria-label="Number of delay days">{[1, 2, 3, 4, 5].map(n => <Button key={n} type="button" size="sm" variant={ext.days === n ? "default" : "outline"} className="flex-1" onClick={() => setExt({ ...ext, days: n })}>{n}</Button>)}</div>
                  <Input aria-label="Reason" placeholder="Reason (e.g. parts delivery late)" maxLength={300} value={ext.reason} onChange={e => setExt({ ...ext, reason: e.target.value })}/>
                  <Button type="submit" variant="outline" className="w-full"><Plus/>Add {ext.days} delay day{ext.days === 1 ? "" : "s"}</Button>
                </form>
                <Button variant="ghost" size="sm" className="mt-3 w-full text-destructive" onClick={() => { if (confirm("Delete the whole site plan, including daily tasks?")) void run(() => resetPlan({ data: { id: p.id } }), "Plan reset"); }}><RotateCcw/>Reset plan</Button>
              </Card>
            </>}
          </div>
        </div>
      </>;
    }}</QueryState>
  </div>;
}

function Legend({ c, children }: { c: string; children: React.ReactNode }) { return <span className="inline-flex items-center gap-1.5"><span className={cn("size-3 rounded-sm", c)}/>{children}</span>; }

type Task = { id: string; title: string; work_date: string; start_hour: number; end_hour: number; notes: string; done: boolean; is_extension: boolean; checklist: unknown };
function DayEditor({ task, worked, onRestore, onClose, onSaved }: { task: Task; worked: boolean; onRestore: () => void; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const update = useServerFn(projectService.updateTask);
  const [f, setF] = useState({ title: task.title, notes: task.notes, start_hour: task.start_hour, end_hour: task.end_hour, done: task.done, checklist: ((task.checklist as Item[] | null) ?? []) });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setF({ title: task.title, notes: task.notes, start_hour: task.start_hour, end_hour: task.end_hour, done: task.done, checklist: ((task.checklist as Item[] | null) ?? []) }); }, [task]);
  const save = async (patch = f, msg = "Day saved") => { setBusy(true); try { await update({ data: { id: task.id, ...patch } }); await onSaved(); toast.success(msg); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); } };
  const add = () => { const t = draft.trim(); if (!t) return; setF({ ...f, checklist: [...f.checklist, { text: t, done: false }] }); setDraft(""); };

  return <Card className="rounded-md p-5 shadow-none">
    <div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-muted-foreground">{fmtDate(task.work_date)}{task.is_extension && " · Delay day"}{worked && " · Rest day worked"}</p><h2 className="font-bold">Tasks for this day</h2></div><Button size="icon" variant="ghost" aria-label="Close" onClick={onClose}><X/></Button></div>
    <div className="mt-4 space-y-4">
      <div className="space-y-1.5"><Label htmlFor="dt">Title</Label><Input id="dt" value={f.title} maxLength={120} onChange={e => setF({ ...f, title: e.target.value })}/></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="ds">From</Label><Input id="ds" type="number" min={0} max={23} value={f.start_hour} onChange={e => setF({ ...f, start_hour: Number(e.target.value) })}/></div><div className="space-y-1.5"><Label htmlFor="de">To</Label><Input id="de" type="number" min={1} max={24} value={f.end_hour} onChange={e => setF({ ...f, end_hour: Number(e.target.value) })}/></div></div>
      <div><Label>To do</Label>
        <ul className="mt-2 space-y-1.5">{f.checklist.map((it, i) => <li key={i} className="flex items-center gap-2"><input type="checkbox" aria-label={`Done: ${it.text}`} checked={it.done} onChange={e => setF({ ...f, checklist: f.checklist.map((x, k) => k === i ? { ...x, done: e.target.checked } : x) })} className="size-4 accent-[var(--primary)]"/><span className={cn("flex-1 text-sm", it.done && "text-muted-foreground line-through")}>{it.text}</span><Button size="icon" variant="ghost" className="size-7" aria-label="Remove task" onClick={() => setF({ ...f, checklist: f.checklist.filter((_, k) => k !== i) })}><X className="size-3.5"/></Button></li>)}</ul>
        <div className="mt-2 flex gap-2"><Input aria-label="New task" placeholder="e.g. Remove old bathtub" maxLength={200} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}/><Button type="button" size="icon" variant="outline" aria-label="Add task" onClick={add}><Plus/></Button></div></div>
      <div className="space-y-1.5"><Label htmlFor="dn">Notes</Label><Textarea id="dn" rows={3} maxLength={1000} value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} placeholder="Materials to bring, access, contacts…"/></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.done} onChange={e => setF({ ...f, done: e.target.checked })} className="size-4 accent-[var(--primary)]"/>Day completed</label>
      <Button className="w-full" disabled={busy || f.end_hour <= f.start_hour} onClick={() => save()}>{busy ? "Saving…" : "Save day"}</Button>
      <div className="flex flex-wrap gap-2">{worked && <Button size="sm" variant="ghost" onClick={onRestore}><RotateCcw/>Restore rest day</Button>}{task.is_extension && <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { try { await update({ data: { id: task.id, remove: true } }); await onSaved(); onClose(); toast.success("Delay day removed"); } catch (e) { toast.error(errMsg(e)); } }}><Trash2/>Remove delay day</Button>}</div>
    </div>
  </Card>;
}
