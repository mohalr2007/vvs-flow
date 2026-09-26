import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarPlus, Check, ChevronLeft, ChevronRight, Phone, MapPin, Trash2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { projectService } from "@/lib/services";
import { PROJECT_STEPS, statusLabel, type ProjectStatus } from "@/lib/vvs-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/projects_/$projectId")({
  head: () => ({ meta: [{ title: "Project details — VVS Flow" }, { name: "description", content: "Project details and site work calendar." }, { property: "og:title", content: "Project details — VVS Flow" }, { property: "og:description", content: "Plan every working day of a plumbing project." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ProjectDetail,
});

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const get = useServerFn(projectService.get), addDays = useServerFn(projectService.addDays), update = useServerFn(projectService.updateTask), setStatus = useServerFn(projectService.setStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["project", projectId], queryFn: () => get({ data: { id: projectId } }) });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["project", projectId] }), qc.invalidateQueries({ queryKey: ["projects"] }), qc.invalidateQueries({ queryKey: ["calendar"] })]);

  const [form, setForm] = useState({ title: "Site work", startDate: iso(new Date()), days: 10, skipWeekends: true, startHour: 8, endHour: 16, notes: "" });
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" asChild><Link to="/dashboard/projects"><ArrowLeft/>All projects</Link></Button>
    <QueryState q={q}>{({ project: p, tasks }) => {
      const byDate = new Map<string, typeof tasks>();
      tasks.forEach(t => byDate.set(t.work_date, [...(byDate.get(t.work_date) ?? []), t]));
      const doneCount = tasks.filter(t => t.done).length;
      const first = new Date(month); const lead = (first.getDay() + 6) % 7;
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
      const today = iso(new Date());
      return <>
        <PageHeader title={p.title} description={`${p.customer_name} · ${p.ref} · Budget ${p.budget}`} action={<StatusBadge tone={p.status === "completed" || p.status === "project_approved" ? "success" : p.status === "owner_review" ? "warning" : "info"}>{statusLabel(p.status)}</StatusBadge>}/>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="rounded-md p-5 shadow-none"><h2 className="font-bold">Project details</h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{p.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground"/>{p.phone}</a>}{p.address && <span className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground"/>{p.address}</span>}</div>
              {p.description && <p className="mt-4 whitespace-pre-wrap text-sm">{p.description}</p>}
              <h3 className="mt-6 text-sm font-semibold">Workflow stage</h3>
              <div className="mt-3 flex flex-wrap gap-2">{PROJECT_STEPS.map((s, k) => <button key={s} onClick={async () => { try { await setStatus({ data: { id: p.id, status: s as ProjectStatus } }); await refresh(); } catch (e) { toast.error(errMsg(e)); } }} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", s === p.status ? "border-copper bg-copper text-background" : k < PROJECT_STEPS.indexOf(p.status) ? "border-copper/40 bg-copper/10" : "hover:bg-muted")}>{statusLabel(s)}</button>)}</div>
            </Card>

            <Card className="rounded-md p-5 shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Site calendar</h2><p className="text-sm text-muted-foreground">{tasks.length} working day{tasks.length === 1 ? "" : "s"} planned · {doneCount} done</p></div>
                <div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft/></Button><span className="min-w-32 text-center text-sm font-semibold">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span><Button size="icon" variant="outline" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight/></Button></div></div>
              <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <span key={d}>{d}</span>)}</div>
              <div className="mt-1 grid grid-cols-7 gap-1">{cells.map((c, i) => { if (!c) return <div key={i}/>; const k = iso(c); const ts = byDate.get(k) ?? []; return <button key={k} onClick={() => setForm(f => ({ ...f, startDate: k }))} title={ts.map(t => t.title).join("\n")} className={cn("min-h-16 rounded-md border p-1.5 text-left text-xs transition-colors hover:border-copper", ts.length && (ts.every(t => t.done) ? "border-success/50 bg-success/10" : "border-copper/50 bg-copper/12"), k === form.startDate && "ring-2 ring-primary", k === today && "font-bold text-primary")}><span>{c.getDate()}</span>{ts[0] && <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-foreground">{ts[0].start_hour}–{ts[0].end_hour}h</p>}</button>; })}</div>
              <p className="mt-3 text-xs text-muted-foreground">Click a day to use it as the start date. Planned days also appear in the main calendar.</p>
            </Card>

            <Card className="rounded-md p-5 shadow-none"><h2 className="font-bold">Planned working days</h2>
              {tasks.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No working days yet. Plan the site schedule with the form.</p> : <ul className="mt-3 divide-y">{tasks.map(t => <li key={t.id} className="flex items-center gap-3 py-2.5"><button aria-label={t.done ? "Mark as not done" : "Mark as done"} onClick={async () => { await update({ data: { id: t.id, done: !t.done } }); await refresh(); }} className={cn("grid size-7 shrink-0 place-items-center rounded-full border", t.done && "border-success bg-success text-background")}>{t.done && <Check className="size-4"/>}</button><div className="min-w-0 flex-1"><p className={cn("truncate text-sm font-semibold", t.done && "line-through opacity-60")}>{t.title}</p><p className="text-xs text-muted-foreground">{fmtDate(t.work_date)} · {String(t.start_hour).padStart(2, "0")}:00–{String(t.end_hour).padStart(2, "0")}:00{t.notes && ` · ${t.notes}`}</p></div><Button size="icon" variant="ghost" aria-label="Remove day" onClick={async () => { await update({ data: { id: t.id, remove: true } }); await refresh(); }}><Trash2/></Button></li>)}</ul>}
            </Card>
          </div>

          <Card className="h-fit rounded-md p-5 shadow-none xl:sticky xl:top-24"><h2 className="flex items-center gap-2 font-bold"><CalendarPlus className="size-5 text-copper"/>Schedule site work</h2>
            <form className="mt-4 space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); try { const r = await addDays({ data: { projectId: p.id, ...form } }); await refresh(); toast.success(`${r.count} working day${r.count === 1 ? "" : "s"} added to the calendar`); const [y, m] = form.startDate.split("-").map(Number); setMonth(new Date(y!, m! - 1, 1)); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); } }}>
              <div className="space-y-1.5"><Label htmlFor="t">Step / task</Label><Input id="t" value={form.title} maxLength={120} required onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Demolition, Pipe installation"/></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="sd">Start date</Label><Input id="sd" type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}/></div><div className="space-y-1.5"><Label htmlFor="nd">Working days</Label><Input id="nd" type="number" min={1} max={90} value={form.days} onChange={e => setForm({ ...form, days: Math.max(1, Math.min(90, Number(e.target.value) || 1)) })}/></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="sh">From (hour)</Label><Input id="sh" type="number" min={0} max={23} value={form.startHour} onChange={e => setForm({ ...form, startHour: Number(e.target.value) })}/></div><div className="space-y-1.5"><Label htmlFor="eh">To (hour)</Label><Input id="eh" type="number" min={1} max={24} value={form.endHour} onChange={e => setForm({ ...form, endHour: Number(e.target.value) })}/></div></div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-3"><Label htmlFor="sw">Skip weekends</Label><Switch id="sw" checked={form.skipWeekends} onCheckedChange={v => setForm({ ...form, skipWeekends: v })}/></div>
              <div className="space-y-1.5"><Label htmlFor="n">Notes</Label><Textarea id="n" rows={2} maxLength={1000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Scheduling…" : `Add ${form.days} working day${form.days === 1 ? "" : "s"}`}</Button>
            </form>
          </Card>
        </div>
      </>;
    }}</QueryState>
  </div>;
}
