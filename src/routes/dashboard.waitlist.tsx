import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Radio, Send, ExternalLink } from "lucide-react";
import { PageHeader, StatusBadge, EmptyState } from "@/components/vvs/primitives";
import { Countdown } from "@/components/vvs/countdown";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { waitlistService } from "@/lib/services";
import { fmtRange, fmtShortDay, sek } from "@/lib/time";
import type { WaitlistEntry } from "@/lib/vvs-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/waitlist")({
  head: () => ({ meta: [{ title: "Waitlist recovery — VVS Flow" }, { name: "description", content: "Match open plumbing slots with compatible waiting customers." }, { property: "og:title", content: "Waitlist recovery — VVS Flow" }, { property: "og:description", content: "Explainable matching for schedule recovery." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Waitlist,
});

type Match = { entry: WaitlistEntry; score: number; breakdown: { label: string; points: number }[]; eligible: boolean };

function Waitlist() {
  const get = useServerFn(waitlistService.get), match = useServerFn(waitlistService.match), send = useServerFn(waitlistService.sendOffer);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["waitlist"], queryFn: () => get(), refetchInterval: 5000 });
  const [slotId, setSlotId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sending, setSending] = useState(false);
  const refetch = useCallback(() => { qc.invalidateQueries({ queryKey: ["waitlist"] }); }, [qc]);

  return <QueryState q={q}>{(d) => {
    const slot = d.slots.find(s => s.id === slotId) ?? d.slots[0];
    const offer = slot ? d.offers.find(o => o.source_job_id === slot.id && (o.status === "pending" || o.status === "accepted")) : undefined;
    const lastForSlot = slot ? d.offers.find(o => o.source_job_id === slot.id) : undefined;
    const link = offer ? `${typeof window !== "undefined" ? window.location.origin : ""}/offer/${offer.token}` : "";
    const scan = async () => { if (!slot) return; setScanning(true); setMatches(null); setSelected(null); try { const [r] = await Promise.all([match({ data: { id: slot.id } }), new Promise(res => setTimeout(res, 1200))]); setMatches(r as Match[]); setSelected((r as Match[]).find(m => m.eligible) ?? null); } catch (e) { toast.error(errMsg(e)); } finally { setScanning(false); } };
    return <div className="space-y-6"><PageHeader title="Waitlist" description="Recover schedule gaps with clear, deterministic matching." action={<StatusBadge tone="success">{d.entries.filter(e => e.status === "waiting").length} waiting</StatusBadge>}/>
      {d.slots.length > 1 && <div className="flex gap-2 overflow-x-auto">{d.slots.map(s => <Button key={s.id} size="sm" variant={slot?.id === s.id ? "default" : "outline"} onClick={() => { setSlotId(s.id); setMatches(null); setSelected(null); }}>{fmtShortDay(s.scheduled_at!)} · {fmtRange(s.scheduled_at!, s.duration_min).split("–")[0]}</Button>)}</div>}
      {slot ? <Card className="relative overflow-hidden rounded-md border-primary/20 p-6 shadow-none"><div className={scanning ? "absolute inset-x-0 top-0 h-20 bg-accent/60 blur-xl animate-scan" : ""}/><div className="relative grid gap-6 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-bold text-primary">CANCELLED SLOT · RECOVERABLE</p><h2 className="mt-2 text-3xl font-bold">{fmtShortDay(slot.scheduled_at!)} · {fmtRange(slot.scheduled_at!, slot.duration_min)}</h2><p className="mt-2 text-sm text-muted-foreground">{slot.duration_min} minutes · Zone {slot.zone} · was “{slot.title}” ({sek(slot.value)})</p>{lastForSlot && lastForSlot.status !== "pending" && lastForSlot.status !== "accepted" && <p className="mt-2 text-sm text-warning-foreground">Last offer {lastForSlot.status}. Send to the next best match.</p>}</div>
        <div className="flex items-center">
          {offer?.status === "accepted" ? <div className="text-right animate-success"><span className="inline-grid size-12 place-items-center rounded-full bg-success text-success-foreground"><Check/></span><p className="mt-2 font-bold text-success">Slot recovered</p><p className="text-xs text-muted-foreground">{offer.waitlist_entries?.customer_name} accepted</p></div>
          : offer ? <div className="grid justify-items-end gap-2 text-right"><StatusBadge tone="info">Offer sent to {offer.waitlist_entries?.customer_name}</StatusBadge><Countdown ring seconds={offer.secondsLeft} total={900} onComplete={refetch}/><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Offer link copied"); }}><Copy/>Copy link</Button><Button size="sm" variant="outline" asChild><a href={`/offer/${offer.token}`} target="_blank" rel="noreferrer"><ExternalLink/>Open as customer</a></Button></div><p className="max-w-60 text-xs text-muted-foreground">{offer.waitlist_entries?.email ? "The customer was notified by email." : "No email on file — share the link with the customer."}</p></div>
          : scanning ? <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Radio className="animate-pulse"/>Searching compatible customers…</p>
          : selected ? <Button disabled={sending} onClick={async () => { setSending(true); try { await send({ data: { jobId: slot.id, waitlistId: selected.entry.id } }); setMatches(null); setSelected(null); refetch(); toast.success("15-minute offer created"); } catch (e) { toast.error(errMsg(e)); } finally { setSending(false); } }}><Send/>{sending ? "Sending…" : `Send 15-minute offer to ${selected.entry.customer_name.split(" ")[0]}`}</Button>
          : <Button onClick={scan}><Radio/>{matches ? "Scan again" : "Find best match"}</Button>}
        </div></div></Card> : <EmptyState title="No recoverable slots" description="When an appointment is cancelled, its time appears here for recovery."/>}
      <div className="grid gap-5 xl:grid-cols-[1fr_.75fr]"><Card className="overflow-hidden rounded-md shadow-none"><div className="border-b p-5"><h2 className="font-bold">{matches ? "Best matches for this slot" : "Waiting customers"}</h2><p className="mt-1 text-sm text-muted-foreground">Ranked by route, duration, flexibility and wait time.</p></div>
        {matches ? (matches.length ? matches.map(m => <button key={m.entry.id} onClick={() => setSelected(m)} disabled={!m.eligible} className={cn("grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b p-4 text-left transition-colors last:border-0 hover:bg-muted/60 disabled:opacity-50", selected?.entry.id === m.entry.id && "bg-accent/60")}><div className="grid size-12 place-items-center rounded-full bg-accent font-bold text-accent-foreground">{m.score}</div><div className="min-w-0"><p className="truncate font-semibold">{m.entry.customer_name}</p><p className="truncate text-sm text-muted-foreground">{m.entry.title} · Zone {m.entry.zone} · {m.entry.duration_min} min</p></div><StatusBadge tone={m.eligible ? "info" : "neutral"}>{m.eligible ? m.entry.flexibility : "Doesn't fit"}</StatusBadge></button>) : <div className="p-6"><EmptyState title="No one waiting" description="Nobody on the waitlist can take this slot."/></div>)
        : d.entries.length ? d.entries.map(e => <div key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b p-4 last:border-0"><div className="min-w-0"><p className="truncate font-semibold">{e.customer_name}</p><p className="truncate text-sm text-muted-foreground">{e.title} · Zone {e.zone} · {e.duration_min} min</p></div><StatusBadge tone={e.status === "offered" ? "warning" : "info"}>{e.status === "offered" ? "Offer pending" : e.flexibility}</StatusBadge></div>) : <div className="p-6"><EmptyState title="No customers waiting" description="Customers you move to the waitlist appear here."/></div>}</Card>
        <Card className="rounded-md p-5 shadow-none">{selected ? <><p className="text-3xl font-bold text-primary">{selected.score} points</p><p className="mt-1 text-sm text-muted-foreground">{selected.entry.customer_name} · {selected.entry.title}</p><div className="mt-6 space-y-4">{selected.breakdown.map(b => <div key={b.label}><div className="flex justify-between text-sm"><span>{b.label}</span><strong>+{b.points}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, b.points * 2.5)}%` }}/></div></div>)}</div></> : <p className="text-sm text-muted-foreground">Run “Find best match” to see an explainable score breakdown.</p>}<p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">Same zone +40 · Duration fits +30 · Flexibility up to +15 · Waiting up to +5 · Urgency up to +2. The score never contacts a customer on its own.</p></Card></div>
    </div>;
  }}</QueryState>;
}
