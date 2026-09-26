import { ArrowRight, Clock3, MapPin, CalendarClock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./primitives";
import { statusLabel, statusTone, type Job } from "@/lib/vvs-data";
import { fmtShortDay, fmtTime } from "@/lib/time";

export function JobCard({ job }: { job: Job }) {
  return <Card className="rounded-md p-4 shadow-none transition-transform hover:-translate-y-0.5"><div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{job.title}</h3><StatusBadge tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusBadge>{job.is_emergency && <StatusBadge tone="danger">Emergency</StatusBadge>}</div><p className="mt-1 text-sm text-muted-foreground">{job.customer_name} · {job.ref}</p><div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5"/>{job.duration_min} min</span>{job.zone && <span className="flex items-center gap-1"><MapPin className="size-3.5"/>Zone {job.zone}</span>}{job.scheduled_at && <span className="flex items-center gap-1"><CalendarClock className="size-3.5"/>{fmtShortDay(job.scheduled_at)} · {fmtTime(job.scheduled_at)}</span>}</div></div><Button asChild variant="ghost" size="icon" aria-label={`Review ${job.title}`}><Link to="/dashboard/jobs/$jobId" params={{ jobId: job.id }}><ArrowRight/></Link></Button></div></Card>;
}

export type TimelineItem = { key: string; time: string; title: string; customer: string; status: string; tone: string; current?: boolean };
export function Timeline({ items }: { items: TimelineItem[] }) {
  return <div className="relative ml-2 border-l pl-6">{items.map((item) => item.current
    ? <div key={item.key} className="relative pb-6" aria-label={`Current time ${item.time}`}><span className="absolute -left-[33px] top-1 size-4 rounded-full border-4 border-background bg-destructive shadow"/><div className="flex items-center gap-3"><span className="text-sm font-bold text-destructive">{item.time}</span><span className="h-px flex-1 bg-destructive/40"/><span className="text-xs font-semibold text-destructive">Now</span></div></div>
    : <div className="relative pb-6 last:pb-0" key={item.key}><span className="absolute -left-[31px] top-1.5 size-3 rounded-full border-2 border-background bg-border"/><div className="grid grid-cols-[58px_minmax(0,1fr)_auto] items-start gap-3"><span className="text-sm font-bold">{item.time}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.customer}</p></div><StatusBadge tone={item.tone as "neutral"}>{item.status}</StatusBadge></div></div>)}</div>;
}

export function PageSkeleton() { return <div className="space-y-6" aria-busy="true" aria-label="Loading"><Skeleton className="h-10 w-64"/><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div><Skeleton className="h-80"/></div>; }
