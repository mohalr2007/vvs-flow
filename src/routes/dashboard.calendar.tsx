import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/vvs/primitives";
import { QueryState } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { jobService } from "@/lib/services";
import { fmtShortDay, fmtTime, sameStockholmDay, stockholmParts } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/calendar")({
  head: () => ({ meta: [{ title: "Calendar — VVS Flow" }, { name: "description", content: "Day and week plumbing schedule with route buffers." }, { property: "og:title", content: "Calendar — VVS Flow" }, { property: "og:description", content: "Plan appointments, capacity, and travel time." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Calendar,
});

const START = 7, END = 18, ROW = 56;
const tone = (s: string) => s === "cancelled" ? "bg-destructive/8 border-destructive line-through" : s === "access_confirmed" || s === "in_progress" ? "bg-success/12 border-success" : s === "confirmed" ? "bg-warning/15 border-warning" : "bg-accent border-primary";

function Calendar() {
  const [view, setView] = useState<"Day" | "Week">("Week");
  const [offset, setOffset] = useState(0);
  const cal = useServerFn(jobService.calendar);
  const q = useQuery({ queryKey: ["calendar", offset], queryFn: () => cal({ data: { offsetDays: offset } }) });
  return <div className="mx-auto max-w-6xl space-y-6 animate-fade-up"><PageHeader title="Calendar" description="Work, travel, and protected capacity in one operational view." action={<div className="flex items-center gap-2"><Button size="icon" variant="outline" aria-label="Previous" onClick={() => setOffset(o => o - (view === "Week" ? 7 : 1))}><ChevronLeft/></Button><Button size="sm" variant="outline" onClick={() => setOffset(0)}>Today</Button><Button size="icon" variant="outline" aria-label="Next" onClick={() => setOffset(o => o + (view === "Week" ? 7 : 1))}><ChevronRight/></Button><div className="flex rounded-lg border bg-card p-1">{(["Day", "Week"] as const).map(v => <Button key={v} size="sm" variant={view === v ? "default" : "ghost"} onClick={() => setView(v)}>{v}</Button>)}</div></div>}/>
    <QueryState q={q}>{(d) => {
      const days = Array.from({ length: view === "Week" ? 7 : 1 }, (_, i) => new Date(new Date(d.from).getTime() + i * 86400000 + 3600000 * 12));
      const now = new Date(d.now);
      const nowP = stockholmParts(now);
      return <Card className="overflow-x-auto rounded-2xl shadow-none"><div className={cn("p-5", view === "Week" && "min-w-[900px]")}><div className="grid border-b pb-3 text-center font-mono text-xs uppercase text-muted-foreground" style={{ gridTemplateColumns: `60px repeat(${days.length},1fr)` }}><span/>{days.map(day => <span key={day.toISOString()} className={sameStockholmDay(day, now) ? "text-primary" : ""}>{fmtShortDay(day)}</span>)}</div>
        <div className="relative grid" style={{ gridTemplateColumns: `60px repeat(${days.length},1fr)` }}>{Array.from({ length: END - START }, (_, h) => <div key={h} className="contents"><div className="border-b py-1 text-xs text-muted-foreground" style={{ height: ROW }}>{String(START + h).padStart(2, "0")}:00</div>{days.map((day, i) => <div key={i} className={cn("border-b border-l", (d.restDays ?? [0, 6]).includes(new Date(day).getUTCDay()) && "bg-muted/60")} style={{ height: ROW }}/>)}</div>)}
          {days.map((day, di) => d.jobs.filter(j => sameStockholmDay(new Date(j.scheduled_at!), day)).sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!)).flatMap((j, idx, arr) => {
            const p = stockholmParts(new Date(j.scheduled_at!)); const top = ((p.h - START) * 60 + p.mi) / 60 * ROW; const h = j.duration_min / 60 * ROW;
            const col = { left: `calc(60px + (100% - 60px) / ${days.length} * ${di} + 3px)`, width: `calc((100% - 60px) / ${days.length} - 6px)` };
            const out = [<Link key={j.id} to="/dashboard/jobs/$jobId" params={{ jobId: j.id }} className={cn("absolute overflow-hidden rounded-sm border-l-4 p-2 text-xs hover:z-10 hover:shadow", tone(j.status))} style={{ ...col, top: top + 2, height: Math.max(24, h - 4) }}><p className="truncate font-bold">{fmtTime(j.scheduled_at!)} {j.title}</p><p className="truncate text-muted-foreground">{j.customer_name} · {j.zone}</p></Link>];
            const next = arr[idx + 1];
            if (next && next.zone !== j.zone && j.status !== "cancelled") out.push(<div key={j.id + "t"} className="absolute rounded-sm bg-muted px-2 text-[10px] leading-5 text-muted-foreground" style={{ ...col, top: top + h, height: 20 / 60 * ROW }}>Travel · 20 min</div>);
            return out;
          }))}
          {days.map((day, di) => { const p = stockholmParts(day); const key = `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; return d.tasks.filter(t => t.work_date === key).map(t => {
            const s = Math.max(START, t.start_hour), e = Math.min(END, t.end_hour); if (e <= s) return null;
            return <Link key={t.id} to="/dashboard/projects/$projectId" params={{ projectId: t.project_id }} className={cn("absolute overflow-hidden rounded-sm border-l-4 border-copper bg-copper/12 p-2 text-xs hover:z-10 hover:shadow", t.done && "opacity-60")} style={{ left: `calc(60px + (100% - 60px) / ${days.length} * ${di} + ${days.length === 1 ? "50%" : "40%"})`, width: `calc((100% - 60px) / ${days.length} * ${days.length === 1 ? 0.5 : 0.6} - 4px)`, top: (s - START) * ROW + 2, height: (e - s) * ROW - 4 }}><p className="truncate font-bold">{t.title}</p><p className="truncate text-muted-foreground">{t.projects?.customer_name} · {t.projects?.ref}</p></Link>;
          }); })}
          {days.some(day => sameStockholmDay(day, now)) && nowP.h >= START && nowP.h < END && <div aria-label="Current time" className="pointer-events-none absolute h-0.5 bg-destructive" style={{ top: ((nowP.h - START) * 60 + nowP.mi) / 60 * ROW, left: view === "Week" ? `calc(60px + (100% - 60px) / 7 * ${days.findIndex(x => sameStockholmDay(x, now))})` : 60, width: view === "Week" ? "calc((100% - 60px) / 7)" : "calc(100% - 60px)" }}><span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-destructive"/></div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-3"><StatusBadge tone="warning">Confirmed · needs access</StatusBadge><StatusBadge tone="success">Access confirmed</StatusBadge><StatusBadge tone="info">Other</StatusBadge><StatusBadge>Travel buffer</StatusBadge><span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Rest day</span><StatusBadge tone="danger">Cancelled · recoverable</StatusBadge><span className="inline-flex items-center gap-1.5 rounded-full bg-copper/12 px-2.5 py-0.5 text-xs font-semibold text-copper">Project site work</span></div>
        {d.jobs.length === 0 && d.tasks.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No appointments in this period.</p>}</div></Card>;
    }}</QueryState></div>;
}
