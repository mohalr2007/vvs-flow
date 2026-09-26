import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errMsg } from "@/components/vvs/query-state";
import { projectService } from "@/lib/services";
import type { Quote } from "@/lib/owner.functions";
import { cn } from "@/lib/utils";

const VAT = 0.25;
const sek = (n: number) => `${Math.round(n).toLocaleString("sv-SE")} SEK`;
const empty: Quote = { materials: [], labor: 0, deposit: 0, installments: [], notes: "", valid_until: "", status: "draft" };

export function ProjectQuote({ projectId, initial }: { projectId: string; initial: unknown }) {
  const save = useServerFn(projectService.saveQuote);
  const qc = useQueryClient();
  const [q, setQ] = useState<Quote>({ ...empty, ...(initial && typeof initial === "object" ? (initial as Partial<Quote>) : {}) });
  const [busy, setBusy] = useState(false);
  const materials = q.materials.reduce((s, m) => s + m.qty * m.unit_price, 0);
  const net = materials + q.labor, vat = net * VAT, gross = net + vat;
  const scheduled = q.deposit + q.installments.reduce((s, i) => s + i.amount, 0);
  const remaining = gross - scheduled;
  const paid = q.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const setM = (i: number, patch: Partial<Quote["materials"][number]>) => setQ({ ...q, materials: q.materials.map((m, k) => k === i ? { ...m, ...patch } : m) });
  const setI = (i: number, patch: Partial<Quote["installments"][number]>) => setQ({ ...q, installments: q.installments.map((m, k) => k === i ? { ...m, ...patch } : m) });
  const split = (n: number) => { const rest = Math.max(0, gross - q.deposit); const each = Math.round(rest / n); setQ({ ...q, installments: Array.from({ length: n }, (_, k) => ({ label: `Installment ${k + 1}`, amount: k === n - 1 ? Math.round(rest - each * (n - 1)) : each, due: "", paid: false })) }); };

  return <Card className="quote-print rounded-md p-5 shadow-none">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-bold"><FileText className="size-5 text-copper"/>Quote & payment plan</h2>
      <div className="flex items-center gap-2 print:hidden"><select aria-label="Quote status" value={q.status} onChange={e => setQ({ ...q, status: e.target.value as Quote["status"] })} className="h-9 rounded-md border bg-background px-2 text-sm">{["draft", "sent", "accepted", "declined"].map(s => <option key={s} value={s}>{s[0]!.toUpperCase() + s.slice(1)}</option>)}</select><Button size="sm" variant="outline" onClick={() => window.print()}><Printer/>Print</Button></div></div>

    <h3 className="mt-5 text-sm font-semibold">Materials to buy</h3>
    <div className="mt-2 space-y-2">{q.materials.length === 0 && <p className="text-sm text-muted-foreground">No materials yet.</p>}
      {q.materials.map((m, i) => <div key={i} className="grid grid-cols-[1fr_70px_110px_auto] items-center gap-2"><Input aria-label="Item" placeholder="e.g. PEX pipe 16 mm" value={m.name} onChange={e => setM(i, { name: e.target.value })}/><Input aria-label="Quantity" type="number" min={0} value={m.qty} onChange={e => setM(i, { qty: Number(e.target.value) })}/><Input aria-label="Unit price (SEK)" type="number" min={0} value={m.unit_price} onChange={e => setM(i, { unit_price: Number(e.target.value) })}/><Button size="icon" variant="ghost" aria-label="Remove item" className="print:hidden" onClick={() => setQ({ ...q, materials: q.materials.filter((_, k) => k !== i) })}><Trash2/></Button></div>)}
      <Button size="sm" variant="outline" className="print:hidden" onClick={() => setQ({ ...q, materials: [...q.materials, { name: "", qty: 1, unit_price: 0 }] })}><Plus/>Add item</Button></div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="lab">Labour (SEK, excl. VAT)</Label><Input id="lab" type="number" min={0} value={q.labor} onChange={e => setQ({ ...q, labor: Number(e.target.value) })}/></div><div className="space-y-1.5"><Label htmlFor="vu">Quote valid until</Label><Input id="vu" type="date" value={q.valid_until} onChange={e => setQ({ ...q, valid_until: e.target.value })}/></div></div>

    <dl className="mt-5 space-y-1.5 rounded-md bg-muted/50 p-4 text-sm"><Row k="Materials" v={sek(materials)}/><Row k="Labour" v={sek(q.labor)}/><Row k="Subtotal excl. VAT" v={sek(net)}/><Row k="VAT 25%" v={sek(vat)}/><div className="border-t pt-2"><Row k="Total incl. VAT" v={sek(gross)} strong/></div></dl>

    <h3 className="mt-5 text-sm font-semibold">Payments</h3>
    <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-1.5"><Label htmlFor="dep">Deposit paid upfront (SEK)</Label><Input id="dep" type="number" min={0} value={q.deposit} onChange={e => setQ({ ...q, deposit: Number(e.target.value) })}/></div><div className="flex gap-1 print:hidden">{[20, 30, 50].map(p => <Button key={p} size="sm" variant="outline" onClick={() => setQ({ ...q, deposit: Math.round(gross * p / 100) })}>{p}%</Button>)}</div></div>
    <div className="mt-3 space-y-2">{q.installments.map((it, i) => <div key={i} className="grid grid-cols-[auto_1fr_110px_130px_auto] items-center gap-2"><input type="checkbox" aria-label="Paid" checked={it.paid} onChange={e => setI(i, { paid: e.target.checked })} className="size-4 accent-[var(--primary)]"/><Input aria-label="Label" value={it.label} onChange={e => setI(i, { label: e.target.value })}/><Input aria-label="Amount" type="number" min={0} value={it.amount} onChange={e => setI(i, { amount: Number(e.target.value) })}/><Input aria-label="Due date" type="date" value={it.due} onChange={e => setI(i, { due: e.target.value })}/><Button size="icon" variant="ghost" aria-label="Remove installment" className="print:hidden" onClick={() => setQ({ ...q, installments: q.installments.filter((_, k) => k !== i) })}><Trash2/></Button></div>)}
      <div className="flex flex-wrap gap-2 print:hidden"><Button size="sm" variant="outline" onClick={() => setQ({ ...q, installments: [...q.installments, { label: `Installment ${q.installments.length + 1}`, amount: Math.max(0, Math.round(remaining)), due: "", paid: false }] })}><Plus/>Add installment</Button>{[2, 3, 4].map(n => <Button key={n} size="sm" variant="ghost" onClick={() => split(n)}>Split rest in {n}</Button>)}</div></div>
    <p className={cn("mt-3 text-sm", Math.abs(remaining) > 1 ? "text-warning" : "text-success")}>{Math.abs(remaining) <= 1 ? "Payment plan covers the full total." : remaining > 0 ? `${sek(remaining)} not yet scheduled.` : `Plan exceeds total by ${sek(-remaining)}.`} · Received so far: {sek(q.deposit + paid)}</p>

    <div className="mt-5 space-y-1.5"><Label htmlFor="qn">Terms & notes</Label><Textarea id="qn" rows={3} maxLength={3000} value={q.notes} onChange={e => setQ({ ...q, notes: e.target.value })} placeholder="Warranty, exclusions, ROT deduction, access conditions…"/></div>
    <Button className="mt-5 w-full print:hidden" disabled={busy || q.materials.some(m => !m.name.trim())} onClick={async () => { setBusy(true); try { await save({ data: { projectId, quote: q } }); await Promise.all([qc.invalidateQueries({ queryKey: ["project", projectId] }), qc.invalidateQueries({ queryKey: ["projects"] })]); toast.success("Quote saved"); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); } }}>{busy ? "Saving…" : "Save quote"}</Button>
  </Card>;
}
function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) { return <div className={cn("flex justify-between gap-3", strong && "text-base font-bold")}><dt className={strong ? "" : "text-muted-foreground"}>{k}</dt><dd>{v}</dd></div>; }
