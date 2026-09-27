import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leadService } from "@/lib/services";
import { sek } from "@/lib/time";

export const Route = createFileRoute("/dashboard/leads")({
  head: () => ({ meta: [{ title: "Leads — VVS Flow" }, { name: "description", content: "Track and recover plumbing opportunities." }, { property: "og:title", content: "Leads — VVS Flow" }, { property: "og:description", content: "Keep every plumbing inquiry moving toward an outcome." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Leads,
});

const STAGES = ["New", "Qualified", "Held", "Abandoned", "Converted"] as const;

function Leads() {
  const list = useServerFn(leadService.list), setStage = useServerFn(leadService.setStage);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["leads"], queryFn: () => list() });
  const [f, setF] = useState<string>("All");
  const change = async (id: string, stage: (typeof STAGES)[number], msg: string) => { try { await setStage({ data: { id, stage } }); await qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["overview"] }); toast.success(msg); } catch (e) { toast.error(errMsg(e)); } };
  return <div className="mx-auto max-w-5xl space-y-7 animate-fade-up"><PageHeader title="Leads" description="Every inquiry stays visible until it has a clear outcome."/>
    <div className="flex gap-2 overflow-x-auto pb-1">{["All", ...STAGES].map(s => <Button key={s} size="sm" variant={f === s ? "default" : "outline"} onClick={() => setF(s)}>{s}</Button>)}</div>
    <QueryState q={q}>{(leads) => { const shown = leads.filter(l => f === "All" || l.stage === f); return shown.length ? <div className="flex flex-col gap-2">{shown.map((l, i) => <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border/70 bg-card px-5 py-4 animate-fade-up sm:grid-cols-[1fr_1fr_auto_auto_auto]" style={{ animationDelay: `${i * 50}ms` }}><div><p className="font-semibold">{l.name}</p><p className="figma-label mt-1 text-[9px] text-muted-foreground sm:hidden">{l.work} · {sek(l.value)}</p></div><p className="hidden text-sm text-muted-foreground sm:block">{l.work}</p><span className="hidden font-display text-lg text-primary sm:block">{sek(l.value)}</span><StatusBadge tone={l.stage === "Abandoned" ? "danger" : l.stage === "Converted" ? "success" : l.stage === "Qualified" ? "info" : "neutral"}>{l.stage}</StatusBadge>
      {l.stage === "Abandoned" ? <Button size="sm" variant="outline" onClick={() => change(l.id, "Qualified", "Opportunity recovered")}><RefreshCw/>Recover</Button> : <select aria-label={`Stage for ${l.name}`} value={l.stage} onChange={e => change(l.id, e.target.value as (typeof STAGES)[number], "Stage updated")} className="col-span-2 h-9 rounded-lg border border-border bg-background px-2 text-xs font-mono sm:col-span-1">{STAGES.map(s => <option key={s}>{s}</option>)}</select>}</div>)}</div> : <EmptyState title="No leads in this stage" description="New inquiries will appear here."/>; }}</QueryState></div>;
}
