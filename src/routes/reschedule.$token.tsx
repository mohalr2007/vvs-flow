import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { CustomerTokenPage } from "@/components/vvs/token-page";
import { ErrorState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bookingService } from "@/lib/services";
import { fmtDay, fmtRange, fmtShortDay, fmtTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reschedule/$token")({
  head: () => ({ meta: [{ title: "Reschedule appointment — Ekström VVS" }, { name: "description", content: "Choose another available plumbing appointment." }, { property: "og:title", content: "Reschedule appointment — Ekström VVS" }, { property: "og:description", content: "Review alternative appointment times." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: Reschedule,
});

function Reschedule() {
  const { token } = Route.useParams();
  const get = useServerFn(bookingService.rescheduleOptions), move = useServerFn(bookingService.reschedule);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["reschedule", token], queryFn: () => get({ data: { token } }), retry: false });
  const [s, setS] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  return <QueryState q={q} skeleton={<CustomerTokenPage eyebrow="RESCHEDULE" title="Loading…" description=""><div className="h-40 animate-pulse rounded-md bg-muted"/></CustomerTokenPage>}>{({ job, groups }) => {
    if (!job) return <CustomerTokenPage eyebrow="RESCHEDULE" title="This link isn't valid." description="Please contact Ekström VVS."><span/></CustomerTokenPage>;
    const j = job as unknown as { scheduled_at: string | null; duration_min: number; title: string };
    if (done) return <CustomerTokenPage eyebrow="RESCHEDULED" title="Your new time is confirmed." description={`${fmtDay(done)} · ${fmtRange(done, j.duration_min)}`}><div className="text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-success text-success-foreground animate-success"><Check/></div><Button asChild className="mt-6"><Link to="/access/$token" params={{ token }}>Confirm property access</Link></Button></div></CustomerTokenPage>;
    const slots = groups.flatMap(g => g.slots).slice(0, 8);
    return <CustomerTokenPage eyebrow="RESCHEDULE" title="Choose another time." description="Your current appointment stays reserved until you confirm a new one."><Card className="rounded-md p-5 shadow-none"><p className="text-xs font-bold text-muted-foreground">CURRENT APPOINTMENT</p><p className="mt-2 font-bold">{j.scheduled_at ? `${fmtDay(j.scheduled_at)} · ${fmtRange(j.scheduled_at, j.duration_min)}` : "Not scheduled yet"}</p></Card>
      <div className="mt-5 grid gap-3">{slots.length ? slots.map(t => <button onClick={() => setS(t.start)} key={t.start} className={cn("flex min-h-16 items-center justify-between rounded-md border bg-card px-5 text-left font-semibold", s === t.start && "border-primary bg-accent")}><span>{fmtShortDay(t.start)} · {fmtTime(t.start)}<span className="block text-xs font-normal text-muted-foreground">{t.travel}</span></span><ArrowRight className="size-4"/></button>) : <p className="rounded-md bg-muted p-4 text-sm">No other times are free right now. Please call Ekström VVS.</p>}</div>
      {error && <div className="mt-4"><ErrorState message={error}/></div>}
      <Button className="mt-5 w-full" size="lg" disabled={!s || busy} onClick={async () => { setBusy(true); setError(""); try { await move({ data: { token, slotStart: s } }); setDone(s); qc.invalidateQueries(); } catch (e) { setError(errMsg(e)); } finally { setBusy(false); } }}>{busy ? "Confirming…" : "Confirm new time"}</Button></CustomerTokenPage>;
  }}</QueryState>;
}
