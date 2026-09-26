import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Ruler } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { projectService } from "@/lib/services";
import { PROJECT_STEPS, statusLabel } from "@/lib/vvs-data";

export const Route = createFileRoute("/dashboard/projects")({
  head: () => ({ meta: [{ title: "Projects — VVS Flow" }, { name: "description", content: "Track renovation and installation projects for Ekström VVS." }, { property: "og:title", content: "Projects — VVS Flow" }, { property: "og:description", content: "A dedicated view for longer plumbing projects." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Projects,
});

function Projects() {
  const list = useServerFn(projectService.list), advance = useServerFn(projectService.advance);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["projects"], queryFn: () => list() });
  return <div className="space-y-6"><PageHeader title="Projects" description="Renovations and installations move through a deliberate site-to-approval workflow."/>
    <QueryState q={q}>{(projects) => projects.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{projects.map(p => { const i = PROJECT_STEPS.indexOf(p.status); const done = p.status === "completed"; return <Card key={p.id} className="rounded-md border-l-4 border-l-copper p-5 shadow-none"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-md bg-secondary text-copper"><Ruler/></span><StatusBadge tone={done || p.status === "project_approved" ? "success" : p.status === "owner_review" ? "warning" : "info"}>{statusLabel(p.status)}</StatusBadge></div><h2 className="mt-6 text-xl font-bold">{p.title}</h2><p className="mt-1 text-sm text-muted-foreground">{p.customer_name} · {p.ref}</p>{p.description && <p className="mt-3 line-clamp-2 text-sm">{p.description}</p>}
      <ol className="mt-5 flex gap-1" aria-label={`Step ${i + 1} of ${PROJECT_STEPS.length}`}>{PROJECT_STEPS.map((s, k) => <li key={s} title={statusLabel(s)} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-copper" : "bg-muted"}`}/>)}</ol>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-sm"><span className="font-semibold">{p.budget}</span>{!done && <Button size="sm" variant="outline" onClick={async () => { try { const r = await advance({ data: { id: p.id } }); await qc.invalidateQueries({ queryKey: ["projects"] }); toast.success(`Moved to ${statusLabel(r.status)}`); } catch (e) { toast.error(errMsg(e)); } }}>Next: {statusLabel(PROJECT_STEPS[i + 1]!)}<ArrowRight/></Button>}</div></Card>; })}</div> : <EmptyState title="No projects yet" description="Renovation requests from the booking page appear here."/>}</QueryState></div>;
}
