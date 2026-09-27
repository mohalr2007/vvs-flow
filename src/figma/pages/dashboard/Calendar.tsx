import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/figma/components/DashboardLayout";
import { PageHeader, StatusBadge } from "@/components/vvs/primitives";
import { QueryState } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { jobService } from "@/lib/services";
import { fmtShortDay, fmtTime, sameStockholmDay, stockholmParts } from "@/lib/time";
import { cn } from "@/lib/utils";

const START = 7;
const END = 18;
const ROW = 56;

const tone = (status: string) =>
  status === "cancelled"
    ? "bg-destructive/8 border-destructive line-through"
    : status === "access_confirmed" || status === "in_progress"
      ? "bg-success/12 border-success"
      : status === "confirmed"
        ? "bg-warning/15 border-warning"
        : "bg-accent border-primary";

export default function CalendarPage() {
  const [view, setView] = useState<"Day" | "Week">("Week");
  const [offset, setOffset] = useState(0);
  const calendar = useServerFn(jobService.calendar);
  const query = useQuery({
    queryKey: ["calendar", offset],
    queryFn: () => calendar({ data: { offsetDays: offset } }),
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 animate-fade-up md:p-8">
        <PageHeader
          title="Calendar"
          description="Work, travel, and protected capacity in one operational view."
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
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
          }
        />

        <QueryState q={query}>
          {(data) => {
            const days = Array.from(
              { length: view === "Week" ? 7 : 1 },
              (_, index) => new Date(new Date(data.from).getTime() + index * 86400000 + 3600000 * 12),
            );
            const now = new Date(data.now);
            const nowParts = stockholmParts(now);

            return (
              <Card className="overflow-x-auto rounded-2xl shadow-none">
                <div className={cn("p-5", view === "Week" && "min-w-[900px]")}>
                  <div
                    className="grid border-b pb-3 text-center font-mono text-xs uppercase text-muted-foreground"
                    style={{ gridTemplateColumns: `60px repeat(${days.length},1fr)` }}
                  >
                    <span />
                    {days.map((day) => (
                      <span
                        key={day.toISOString()}
                        className={sameStockholmDay(day, now) ? "text-primary" : ""}
                      >
                        {fmtShortDay(day)}
                      </span>
                    ))}
                  </div>

                  <div
                    className="relative grid"
                    style={{ gridTemplateColumns: `60px repeat(${days.length},1fr)` }}
                  >
                    {Array.from({ length: END - START }, (_, hourIndex) => (
                      <div key={hourIndex} className="contents">
                        <div
                          className="border-b py-1 text-xs text-muted-foreground"
                          style={{ height: ROW }}
                        >
                          {String(START + hourIndex).padStart(2, "0")}:00
                        </div>
                        {days.map((day) => (
                          <div
                            key={day.toISOString()}
                            className={cn(
                              "border-b border-l",
                              (data.restDays ?? [0, 6]).includes(day.getUTCDay()) && "bg-muted/60",
                            )}
                            style={{ height: ROW }}
                          />
                        ))}
                      </div>
                    ))}

                    {days.map((day, dayIndex) =>
                      data.jobs
                        .filter((job) => job.scheduled_at && sameStockholmDay(new Date(job.scheduled_at), day))
                        .sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""))
                        .flatMap((job, jobIndex, jobs) => {
                          if (!job.scheduled_at) return [];
                          const parts = stockholmParts(new Date(job.scheduled_at));
                          const top = ((parts.h - START) * 60 + parts.mi) / 60 * ROW;
                          const height = job.duration_min / 60 * ROW;
                          const column = {
                            left: `calc(60px + (100% - 60px) / ${days.length} * ${dayIndex} + 3px)`,
                            width: `calc((100% - 60px) / ${days.length} - 6px)`,
                          };
                          const next = jobs[jobIndex + 1];
                          const items = [
                            <Link
                              key={job.id}
                              to="/dashboard/jobs/$jobId"
                              params={{ jobId: job.id }}
                              className={cn(
                                "absolute overflow-hidden rounded-sm border-l-4 p-2 text-xs hover:z-10 hover:shadow",
                                tone(job.status),
                              )}
                              style={{ ...column, top: top + 2, height: Math.max(24, height - 4) }}
                            >
                              <p className="truncate font-bold">{fmtTime(job.scheduled_at)} {job.title}</p>
                              <p className="truncate text-muted-foreground">{job.customer_name} · {job.zone}</p>
                            </Link>,
                          ];
                          if (next && next.zone !== job.zone && job.status !== "cancelled") {
                            items.push(
                              <div
                                key={`${job.id}-travel`}
                                className="absolute rounded-sm bg-muted px-2 text-[10px] leading-5 text-muted-foreground"
                                style={{ ...column, top: top + height, height: 20 / 60 * ROW }}
                              >
                                Travel · 20 min
                              </div>,
                            );
                          }
                          return items;
                        }),
                    )}

                    {days.map((day, dayIndex) => {
                      const parts = stockholmParts(day);
                      const dateKey = `${parts.y}-${String(parts.m + 1).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`;
                      return data.tasks.filter((task) => task.work_date === dateKey).map((task) => {
                        const start = Math.max(START, task.start_hour);
                        const end = Math.min(END, task.end_hour);
                        if (end <= start) return null;
                        return (
                          <Link
                            key={task.id}
                            to="/dashboard/projects/$projectId"
                            params={{ projectId: task.project_id }}
                            className={cn(
                              "absolute overflow-hidden rounded-sm border-l-4 border-copper bg-copper/12 p-2 text-xs hover:z-10 hover:shadow",
                              task.done && "opacity-60",
                            )}
                            style={{
                              left: `calc(60px + (100% - 60px) / ${days.length} * ${dayIndex} + ${days.length === 1 ? "50%" : "40%"})`,
                              width: `calc((100% - 60px) / ${days.length} * ${days.length === 1 ? 0.5 : 0.6} - 4px)`,
                              top: (start - START) * ROW + 2,
                              height: (end - start) * ROW - 4,
                            }}
                          >
                            <p className="truncate font-bold">{task.title}</p>
                            <p className="truncate text-muted-foreground">
                              {task.projects?.customer_name} · {task.projects?.ref}
                            </p>
                          </Link>
                        );
                      });
                    })}

                    {days.some((day) => sameStockholmDay(day, now)) &&
                      nowParts.h >= START &&
                      nowParts.h < END && (
                        <div
                          aria-label="Current time"
                          className="pointer-events-none absolute h-0.5 bg-destructive"
                          style={{
                            top: ((nowParts.h - START) * 60 + nowParts.mi) / 60 * ROW,
                            left:
                              view === "Week"
                                ? `calc(60px + (100% - 60px) / 7 * ${days.findIndex((day) => sameStockholmDay(day, now))})`
                                : 60,
                            width: view === "Week" ? "calc((100% - 60px) / 7)" : "calc(100% - 60px)",
                          }}
                        >
                          <span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-destructive" />
                        </div>
                      )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <StatusBadge tone="warning">Confirmed · needs access</StatusBadge>
                    <StatusBadge tone="success">Access confirmed</StatusBadge>
                    <StatusBadge tone="info">Other</StatusBadge>
                    <StatusBadge>Travel buffer</StatusBadge>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      Rest day
                    </span>
                    <StatusBadge tone="danger">Cancelled · recoverable</StatusBadge>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-copper/12 px-2.5 py-0.5 text-xs font-semibold text-copper">
                      Project site work
                    </span>
                  </div>
                  {data.jobs.length === 0 && data.tasks.length === 0 && (
                    <p className="mt-4 text-sm text-muted-foreground">No appointments in this period.</p>
                  )}
                </div>
              </Card>
            );
          }}
        </QueryState>
      </div>
    </DashboardLayout>
  );
}
