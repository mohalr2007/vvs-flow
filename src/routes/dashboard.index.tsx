import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowRight, CircleDollarSign, Clock3, DoorOpen, FileQuestion, RefreshCw, ShieldQuestion, CheckCircle2 } from "lucide-react";
import { PageHeader, MetricCard, StatusBadge, EmptyState } from "@/components/vvs/primitives";
import { Timeline, type TimelineItem } from "@/components/vvs/owner-ui";
import { DemoControls } from "@/components/vvs/demo-controls";
import { QueryState } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ownerService } from "@/lib/services";
import { statusLabel, statusTone } from "@/lib/vvs-data";
import { fmtDay, fmtTime, sek } from "@/lib/time";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Operations overview — VVS Flow" }, { name: "description", content: "Action-first operations dashboard for Ekström VVS." }, { property: "og:title", content: "Operations overview — VVS Flow" }, { property: "og:description", content: "See what needs attention across today's plumbing operation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Dashboard,
});

function greeting(iso: string) { const h = Number(fmtTime(iso).slice(0, 2)); return h < 10 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }

function Dashboard() {
  const fetchOverview = useServerFn(ownerService.overview);
  const q = useQuery({ queryKey: ["overview"], queryFn: () => fetchOverview(), refetchInterval: 30000 });
  return <QueryState q={q}>{(d) => {
    const c = d.counts;
    const actions = [
      c.review && [AlertTriangle, `${c.review} job${c.review > 1 ? "s" : ""} need review`, "Review details before scheduling", "/dashboard/jobs", "danger"],
      c.assessment && [FileQuestion, `${c.assessment} unusual request${c.assessment > 1 ? "s" : ""} need assessment`, "Manual review required", "/dashboard/jobs", "warning"],
      c.access && [DoorOpen, `${c.access} appointment${c.access > 1 ? "s" : ""} need access confirmation`, "Today and tomorrow", "/dashboard/jobs", "neutral"],
      c.openSlots && [RefreshCw, `${c.openSlots} cancelled slot${c.openSlots > 1 ? "s" : ""} can be recovered`, d.firstOpenSlot ? `Next at ${fmtTime(d.firstOpenSlot)}` : "", "/dashboard/waitlist", "success"],
      c.projects && [ShieldQuestion, `${c.projects} project${c.projects > 1 ? "s" : ""} awaiting your review`, "Owner decision needed", "/dashboard/projects", "neutral"],
      c.abandoned && [RefreshCw, `${c.abandoned} abandoned lead${c.abandoned > 1 ? "s" : ""} to recover`, "Follow up before they go elsewhere", "/dashboard/leads", "neutral"],
    ].filter(Boolean) as [typeof AlertTriangle, string, string, "/dashboard/jobs", string][];
    const total = actions.reduce((a, x) => a + Number(x[1].split(" ")[0]), 0);
    const nowMs = new Date(d.now).getTime();
    const items: TimelineItem[] = d.today.map((j) => ({ key: j.id, time: fmtTime(j.scheduled_at!), title: j.title, customer: `${j.customer_name} · Zone ${j.zone}`, status: statusLabel(j.status), tone: statusTone(j.status), at: new Date(j.scheduled_at!).getTime() }))
      .concat([{ key: "now", time: fmtTime(d.now), title: "", customer: "", status: "", tone: "", current: true, at: nowMs }] as never)
      .sort((a, b) => (a as unknown as { at: number }).at - (b as unknown as { at: number }).at);
    return <div className="mx-auto max-w-6xl space-y-7 animate-fade-up"><PageHeader eyebrow={fmtDay(d.now).toUpperCase()} title={`${greeting(d.now)}, ${d.ownerName.split(" ")[0]}.`} description="Here's what needs your attention." action={<StatusBadge tone="success">Live data</StatusBadge>}/>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><Card className="overflow-hidden rounded-2xl shadow-none"><div className="border-b p-5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-normal">Needs your attention</h2><p className="mt-1 text-sm text-muted-foreground">{total ? `${total} items across the operation` : "Nothing is waiting on you"}</p></div><span className="grid size-10 place-items-center rounded-full bg-warning/20 font-mono font-bold text-warning-foreground">{total}</span></div></div>
        {actions.length ? <div>{actions.map(([Icon, title, note, to, tone]) => <Link key={title} to={to} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b p-4 transition-colors last:border-0 hover:bg-muted/60"><span className={`grid size-10 place-items-center rounded-md ${tone === "danger" ? "bg-destructive/8 text-destructive" : tone === "success" ? "bg-success/10 text-success" : tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-muted text-primary"}`}><Icon className="size-5"/></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{title}</span><span className="block truncate text-xs text-muted-foreground">{note}</span></span><ArrowRight className="size-4 text-muted-foreground"/></Link>)}</div> : <div className="p-8 text-center text-sm text-muted-foreground"><CheckCircle2 className="mx-auto mb-2 size-7 text-success"/>Every inquiry has an outcome.</div>}</Card>
        <div className="space-y-5"><MetricCard label="Revenue at Risk" value={sek(d.revenueAtRisk)} note="Estimated value of unresolved opportunities — not actual lost revenue." icon={<CircleDollarSign/>}/><MetricCard label="Open capacity today" value={`${Math.floor(d.capacityMin / 60)}h ${d.capacityMin % 60}m`} note="Unbooked working time left in today's schedule." icon={<Clock3/>}/><DemoControls/></div></div>
      <Card className="rounded-2xl p-5 shadow-none"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-display text-lg font-normal">Today's schedule</h2><p className="text-sm text-muted-foreground">Route and access status at a glance</p></div><Button asChild size="sm" variant="outline"><Link to="/dashboard/calendar">Open calendar</Link></Button></div>{d.today.length ? <Timeline items={items}/> : <EmptyState title="No appointments today" description="Open time can be filled from the waitlist."/>}</Card></div>;
  }}</QueryState>;
}
