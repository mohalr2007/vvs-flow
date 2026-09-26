import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { rotService } from "@/lib/services";
import type { RotRecord } from "@/lib/vvs-data";

export const Route = createFileRoute("/dashboard/rot")({
  head: () => ({ meta: [{ title: "ROT summaries — VVS Flow" }, { name: "description", content: "Prepare demo ROT work summaries for completed plumbing jobs." }, { property: "og:title", content: "ROT summaries — VVS Flow" }, { property: "og:description", content: "Review eligible labor and materials before export." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Rot,
});

const eligible = (r: RotRecord) => Math.round(r.labor * 0.3);
function download(rows: RotRecord[]) {
  const csv = [["Customer", "Work", "Labor SEK", "Materials SEK", "Est. ROT deduction SEK", "Status"], ...rows.map(r => [r.customer, r.work, r.labor, r.materials, eligible(r), r.status])].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `rot-summary-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
}

function Rot() {
  const list = useServerFn(rotService.list), setStatus = useServerFn(rotService.setStatus);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["rot"], queryFn: () => list() });
  const change = async (id: string, status: "Ready" | "Review" | "Exported") => { try { await setStatus({ data: { id, status } }); await qc.invalidateQueries({ queryKey: ["rot"] }); } catch (e) { toast.error(errMsg(e)); } };
  return <div className="space-y-6"><PageHeader title="ROT summaries" description="Prepare eligible work details for review and export. Estimated deduction is 30% of labour." action={<StatusBadge tone="info">Demo export — no government connection</StatusBadge>}/>
    <QueryState q={q}>{(rows) => rows.length ? <><Card className="overflow-x-auto rounded-md shadow-none"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/60 text-xs text-muted-foreground"><tr>{["Customer", "Work", "Labor", "Materials", "Est. ROT", "Status"].map(x => <th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead><tbody>{rows.map(r => <tr className="border-t" key={r.id}><td className="px-4 py-4 font-semibold">{r.customer}</td><td className="px-4">{r.work}</td><td className="px-4">{r.labor.toLocaleString("sv-SE")} SEK</td><td className="px-4">{r.materials.toLocaleString("sv-SE")} SEK</td><td className="px-4">{eligible(r).toLocaleString("sv-SE")} SEK</td><td className="px-4"><select aria-label={`Status for ${r.customer}`} value={r.status} onChange={e => change(r.id, e.target.value as "Ready")} className="h-8 rounded-md border bg-background px-2 text-sm">{["Review", "Ready", "Exported"].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></Card>
      <div className="flex justify-end"><Button disabled={!rows.some(r => r.status === "Ready")} onClick={async () => { const ready = rows.filter(r => r.status === "Ready"); download(ready); for (const r of ready) await change(r.id, "Exported"); toast.success(`${ready.length} summaries exported to CSV`); }}><Download/>Export ready summaries (CSV)</Button></div></> : <EmptyState title="No completed work yet" description="Completing a job prepares its ROT summary here."/>}</QueryState></div>;
}
