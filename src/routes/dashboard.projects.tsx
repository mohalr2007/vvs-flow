import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Ruler, CalendarDays } from "lucide-react";
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
  return <div className="mx-auto max-w-5xl space-y-7 animate-fade-up"><PageHeader title="Projects" description="Multi-day site work — plan each day and track delays."/>
    <QueryState q={q}>{(projects) => projects.length ? <div className="flex flex-col gap-3">{projects.map((p, n) => { const i = PROJECT_STEPS.indexOf(p.status); const done = p.status === "completed"; return <Card key={p.id} className="relative rounded-2xl p-6 shadow-none transition-all hover:border-primary/30 animate-fade-up" style={{ animationDelay: `${n * 60}ms` }}><div className="flex items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><span className="figma-label text-[10px] text-muted-foreground">{p.ref}</span><StatusBadge tone={done || p.status === "project_approved" ? "success" : p.status === "owner_review" ? "warning" : "info"}>{statusLabel(p.status)}</StatusBadge></div><h2 className="font-display text-xl font-normal"><Link to="/dashboard/projects/$projectId" params={{ projectId: p.id }} className="after:absolute after:inset-0">{p.title}</Link></h2><p className="mt-1 text-sm text-muted-foreground">{p.customer_name}</p></div><div className="text-right"><p className="font-display text-2xl font-light text-primary">{p.budget}</p><span className="figma-label text-[9px] text-muted-foreground">budget</span></div></div>{p.description && <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
      <ol className="mt-5 flex gap-1" aria-label={`Step ${i + 1} of ${PROJECT_STEPS.length}`}>{PROJECT_STEPS.map((s, k) => <li key={s} title={statusLabel(s)} className={`h-1.5 flex-1 rounded-full ${k <= i ? "bg-copper" : "bg-muted"}`}/>)}</ol>
      <div className="mt-5 flex items-center justify-end gap-2 border-t pt-4 text-sm"><div className="relative z-10 flex gap-2"><Button size="sm" variant="ghost" asChild><Link to="/dashboard/projects/$projectId" params={{ projectId: p.id }}><CalendarDays/>Details</Link></Button>{!done && <Button size="sm" variant="outline" onClick={async () => { try { const r = await advance({ data: { id: p.id } }); await qc.invalidateQueries({ queryKey: ["projects"] }); toast.success(`Moved to ${statusLabel(r.status)}`); } catch (e) { toast.error(errMsg(e)); } }}>Next: {statusLabel(PROJECT_STEPS[i + 1]!)}<ArrowRight/></Button>}</div></div></Card>; })}</div> : <EmptyState title="No projects yet" description="Renovation requests from the booking page appear here."/>}</QueryState></div>;
}
