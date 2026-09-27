import { ArrowRight, Clock3, MapPin, CalendarClock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./primitives";
import { statusLabel, statusTone, type Job } from "@/lib/vvs-data";
import { fmtShortDay, fmtTime } from "@/lib/time";

export function JobCard({ job }: { job: Job }) {
  return <Link to="/dashboard/jobs/$jobId" params={{ jobId: job.id }} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border/70 bg-card px-5 py-4 transition-all hover:border-primary/30 hover:bg-accent/25">
    <span className={job.is_emergency ? "size-2 rounded-full bg-destructive" : job.urgency === "High" ? "size-2 rounded-full bg-warning" : "size-2 rounded-full bg-primary"}/>
    <span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm">{job.customer_name}</strong>{job.confidence < 60 && <StatusBadge tone="danger">AI flag</StatusBadge>}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{job.ref} · {job.title}{job.zone ? ` · Zone ${job.zone}` : ""}</span></span>
    <span className="flex items-center gap-5"><span className="hidden text-right sm:block"><strong className="figma-label block text-xs text-primary">{job.value.toLocaleString("sv-SE")} SEK</strong><small className="text-muted-foreground">{job.duration_min} min</small></span><span className="hidden text-center md:block"><strong className={job.confidence >= 80 ? "figma-label block text-sm text-success" : job.confidence >= 60 ? "figma-label block text-sm text-warning" : "figma-label block text-sm text-destructive"}>{job.confidence}%</strong><small className="text-muted-foreground">AI conf.</small></span><StatusBadge tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusBadge><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></span>
  </Link>;
}

export type TimelineItem = { key: string; time: string; title: string; customer: string; status: string; tone: string; current?: boolean };
export function Timeline({ items }: { items: TimelineItem[] }) {
  return <div className="relative ml-2 border-l pl-6">{items.map((item) => item.current
    ? <div key={item.key} className="relative pb-6" aria-label={`Current time ${item.time}`}><span className="absolute -left-[33px] top-1 size-4 rounded-full border-4 border-background bg-destructive shadow"/><div className="flex items-center gap-3"><span className="text-sm font-bold text-destructive">{item.time}</span><span className="h-px flex-1 bg-destructive/40"/><span className="text-xs font-semibold text-destructive">Now</span></div></div>
    : <div className="relative pb-6 last:pb-0" key={item.key}><span className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-background bg-border"/><div className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-start gap-3"><span className="text-sm font-bold">{item.time}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.customer}</p></div><StatusBadge tone={item.tone as "neutral"}>{item.status}</StatusBadge></div></div>)}</div>;
}

export function PageSkeleton() { return <div className="space-y-6" aria-busy="true" aria-label="Loading"><Skeleton className="h-10 w-64"/><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div><Skeleton className="h-80"/></div>; }
