import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/vvs/primitives";
import { JobCard } from "@/components/vvs/owner-ui";
import { QueryState } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  return <div className="mx-auto max-w-5xl space-y-7 animate-fade-up"><PageHeader title="Jobs" description="Review incoming requests and keep every job moving."/>
    <div className="flex flex-col gap-3 sm:flex-row"><label className="relative block sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or type…" className="pl-9"/><span className="sr-only">Search jobs</span></label><div className="flex gap-2 overflow-x-auto pb-1">{(Object.keys(filters) as (keyof typeof filters)[]).map(k => <Button key={k} size="sm" variant={f === k ? "default" : "outline"} className="rounded-lg" onClick={() => setF(k)}>{k}</Button>)}</div></div>
    <QueryState q={q}>{(jobs) => { const term = search.trim().toLowerCase(); const shown = jobs.filter(j => filters[f](j.status) && (!term || j.customer_name.toLowerCase().includes(term) || j.title.toLowerCase().includes(term) || j.ref.toLowerCase().includes(term))); return shown.length ? <div className="flex flex-col gap-2">{shown.map(j => <JobCard job={j} key={j.id}/>)}</div> : <EmptyState title="No jobs match" description="Try another search or filter."/>; }}</QueryState></div>;
}
