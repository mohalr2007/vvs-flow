import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Clock3, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/figma/components/DashboardLayout";
import { QueryState } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { jobService, ownerService } from "@/lib/services";
import { fmtTime, sameStockholmDay, stockholmParts } from "@/lib/time";
import { cn } from "@/lib/utils";

const statusDetails = (status: string) => {
  if (status === "cancelled") return { label: "Cancelled", tone: "bg-destructive/10 text-destructive" };
  if (status === "access_confirmed") return { label: "Access confirmed", tone: "bg-success/12 text-success" };
  if (status === "in_progress") return { label: "In progress", tone: "bg-primary/12 text-primary" };
  if (status === "confirmed") return { label: "Needs access", tone: "bg-warning/15 text-warning-foreground" };
  return { label: status.replaceAll("_", " "), tone: "bg-muted text-muted-foreground" };
};

const longDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Stockholm",
  }).format(date);

export default function CalendarPage() {
  const [view, setView] = useState<"Day" | "Week">("Week");
  const [offset, setOffset] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);

  const calendar = useServerFn(jobService.calendar);
  const clearAppointments = useServerFn(ownerService.clearAppointments);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["calendar", offset],
    queryFn: () => calendar({ data: { offsetDays: offset } }),
  });

  const handleClearCalendar = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setClearing(true);
    try {
      await clearAppointments();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["calendar"] }),
        qc.invalidateQueries({ queryKey: ["jobs"] }),
        qc.invalidateQueries({ queryKey: ["overview"] }),
      ]);
      toast.success("Calendar cleared — all bookings and appointments deleted");
      setIsClearOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear calendar");
    } finally {
      setClearing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 animate-fade-up md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-light sm:text-4xl">Calendar</h1>
            <p className="mt-2 text-sm text-muted-foreground">Work, travel, and protected capacity in one clear view.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Clear calendar button with AlertDialog confirmation */}
            <AlertDialog open={isClearOpen} onOpenChange={setIsClearOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                  disabled={clearing}
                >
                  <Trash2 className="size-3.5" />
                  <span>{clearing ? "Clearing…" : "Clear calendar"}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Empty the calendar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all appointments, scheduled bookings, and site work tasks.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={clearing}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearCalendar}
                    disabled={clearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {clearing ? "Clearing…" : "Yes, empty calendar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label="Previous"
                onClick={() => setOffset((current) => current - (view === "Week" ? 7 : 1))}
              >
                <ChevronLeft />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOffset(0)}>
                Today
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label="Next"
                onClick={() => setOffset((current) => current + (view === "Week" ? 7 : 1))}
              >
                <ChevronRight />
              </Button>
            </div>
            <div className="flex rounded-lg border bg-card p-1">
              {(["Day", "Week"] as const).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={view === option ? "default" : "ghost"}
                  onClick={() => setView(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <QueryState q={query}>
          {(data) => {
            const days = Array.from(
              { length: view === "Week" ? 7 : 1 },
              (_, index) => new Date(new Date(data.from).getTime() + index * 86400000 + 3600000 * 12),
            );
            const now = new Date(data.now);
            const totalEvents = data.jobs.filter((job) => job.scheduled_at).length + data.tasks.length;

            return (
              <Card className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-none">
                <div className="divide-y">
                  {days.map((day) => {
                    const parts = stockholmParts(day);
                    const dateKey = `${parts.y}-${String(parts.m + 1).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
                    const jobs = data.jobs
                      .filter((job) => job.scheduled_at && sameStockholmDay(new Date(job.scheduled_at), day))
                      .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
                    const tasks = data.tasks
                      .filter((task) => task.work_date === dateKey)
                      .sort((a, b) => a.start_hour - b.start_hour);
                    const events = [
                      ...jobs.map((job) => ({ kind: "job" as const, hour: stockholmParts(new Date(job.scheduled_at as string)).h, minute: stockholmParts(new Date(job.scheduled_at as string)).mi, item: job })),
                      ...tasks.map((task) => ({ kind: "task" as const, hour: task.start_hour, minute: 0, item: task })),
                    ].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
                    const isRestDay = (data.restDays ?? [0, 6]).includes(day.getUTCDay());
                    const isToday = sameStockholmDay(day, now);

                    return (
                      <section key={day.toISOString()}>
                        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-muted/55 px-4 py-3 sm:px-6">
                          <div className="flex min-w-0 items-center gap-3">
                            <h2 className="min-w-0 font-display text-lg capitalize text-foreground sm:text-xl">{longDate(day)}</h2>
                            {isToday && <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Today</span>}
                          </div>
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {isRestDay ? "Rest day" : `${events.length} ${events.length === 1 ? "event" : "events"}`}
                          </span>
                        </header>

                        {events.length === 0 ? (
                          <div className="px-4 py-5 text-sm text-muted-foreground sm:px-6">
                            {isRestDay ? "No work planned." : "No appointments — this day is free."}
                          </div>
                        ) : (
                          <div className="divide-y divide-border/60">
                            {events.map((event, index) => {
                              if (event.kind === "task") {
                                const task = event.item;
                                return (
                                  <Link
                                    key={`task-${task.id}`}
                                    to="/dashboard/projects/$projectId"
                                    params={{ projectId: task.project_id }}
                                    className={cn("grid grid-cols-[64px_minmax(0,1fr)] gap-3 px-4 py-4 transition-colors hover:bg-copper/5 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center sm:px-6", task.done && "opacity-60")}
                                  >
                                    <div className="shrink-0">
                                      <p className="text-sm font-bold tabular-nums text-foreground">{String(task.start_hour).padStart(2, "0")}:00</p>
                                      <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">{task.end_hour - task.start_hour}h</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-foreground">{task.title}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">{task.projects?.customer_name || "Project work"}</p>
                                    </div>
                                    <span className="col-start-2 w-fit rounded-full bg-copper/12 px-2.5 py-1 text-[10px] font-bold uppercase text-copper sm:col-start-auto">Site work</span>
                                  </Link>
                                );
                              }

                              const job = event.item;
                              if (!job.scheduled_at) return null;
                              const details = statusDetails(job.status);
                              const nextJob = jobs[jobs.findIndex((candidate) => candidate.id === job.id) + 1];
                              const showTravel = nextJob && nextJob.zone !== job.zone && job.status !== "cancelled";
                              return (
                                <div key={`job-${job.id}`}>
                                  <Link
                                    to="/dashboard/jobs/$jobId"
                                    params={{ jobId: job.id }}
                                    className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 px-4 py-4 transition-colors hover:bg-muted/45 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                                  >
                                    <div className="shrink-0">
                                      <p className="text-sm font-bold tabular-nums text-foreground">{fmtTime(job.scheduled_at)}</p>
                                      <p className="mt-0.5 text-[10px] font-medium uppercase text-muted-foreground">{job.duration_min} min</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className={cn("text-sm font-semibold text-foreground", job.status === "cancelled" && "line-through")}>{job.title}</p>
                                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        <span>{job.customer_name}</span>
                                        <span className="inline-flex items-center gap-1"><MapPin className="size-3 shrink-0" />Zone {job.zone}</span>
                                      </p>
                                    </div>
                                    <span className={cn("col-start-2 w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase sm:col-start-auto", details.tone)}>{details.label}</span>
                                  </Link>
                                  {showTravel && (
                                    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 bg-muted/25 px-4 py-2 text-xs text-muted-foreground sm:grid-cols-[80px_minmax(0,1fr)] sm:px-6">
                                      <span />
                                      <span className="inline-flex items-center gap-2"><Clock3 className="size-3.5 shrink-0" />Travel time · 20 min</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
                <footer className="flex items-center justify-between border-t bg-card px-4 py-4 text-xs font-medium text-muted-foreground sm:px-6">
                  <span>
                    {totalEvents} {totalEvents === 1 ? "event" : "events"} in this {view === "Week" ? "week" : "day"}
                  </span>
                  {totalEvents > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsClearOpen(true)}
                      className="cursor-pointer text-xs text-destructive hover:underline"
                    >
                      Empty calendar ({totalEvents})
                    </button>
                  )}
                </footer>
              </Card>
            );
          }}
        </QueryState>
      </div>
    </DashboardLayout>
  );
}
