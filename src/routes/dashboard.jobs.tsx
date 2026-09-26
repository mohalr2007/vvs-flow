import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageHeader, EmptyState } from "@/components/vvs/primitives";
import { JobCard } from "@/components/vvs/owner-ui";
import { QueryState } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { jobService } from "@/lib/services";

export const Route = createFileRoute("/dashboard/jobs")({
  head: () => ({ meta: [{ title: "Jobs — VVS Flow" }, { name: "description", content: "Review and manage Ekström VVS service jobs." }, { property: "og:title", content: "Jobs — VVS Flow" }, { property: "og:description", content: "Review new, confirmed, and uncertain service requests." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: JobsLayout,
});

const filters = { All: () => true, Review: (s: string) => s === "new" || s === "qualified", Assessment: (s: string) => s === "needs_assessment", Scheduled: (s: string) => s === "confirmed" || s === "access_confirmed" || s === "in_progress", Closed: (s: string) => ["completed", "cancelled", "expired", "waitlisted"].includes(s) } as const;

function JobsLayout() {
  const child = useMatch({ from: "/dashboard/jobs/$jobId", shouldThrow: false });
  if (child) return <Outlet />;
  return <Jobs />;
}

function Jobs() {
  const list = useServerFn(jobService.list);
  const q = useQuery({ queryKey: ["jobs"], queryFn: () => list() });
  const [f, setF] = useState<keyof typeof filters>("All");
  return <div className="space-y-6"><PageHeader title="Jobs" description="Review incoming requests and keep every job moving."/>
    <div className="flex gap-2 overflow-x-auto pb-1">{(Object.keys(filters) as (keyof typeof filters)[]).map(k => <Button key={k} size="sm" variant={f === k ? "default" : "outline"} onClick={() => setF(k)}>{k}</Button>)}</div>
    <QueryState q={q}>{(jobs) => { const shown = jobs.filter(j => filters[f](j.status)); return shown.length ? <div className="grid gap-3 lg:grid-cols-2">{shown.map(j => <JobCard job={j} key={j.id}/>)}</div> : <EmptyState title="No jobs here" description="New customer requests will appear automatically."/>; }}</QueryState></div>;
}
