import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, DoorOpen, KeyRound, Home, CalendarClock } from "lucide-react";
import { CustomerTokenPage } from "@/components/vvs/token-page";
import { ErrorState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { bookingService } from "@/lib/services";
import { ACCESS_OPTIONS } from "@/lib/vvs-data";
import { fmtDay, fmtRange } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/access/$token")({
  head: () => ({ meta: [{ title: "Your booking & property access — Ekström VVS" }, { name: "description", content: "View your appointment and let Ekström VVS know how to access your property." }, { property: "og:title", content: "Confirm property access — Ekström VVS" }, { property: "og:description", content: "Choose a convenient access option for your appointment." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" }] }),
  component: Access,
});

const icons = [Home, KeyRound, DoorOpen, CalendarClock];

function Access() {
  const { token } = Route.useParams();
  const get = useServerFn(bookingService.byToken), confirm = useServerFn(bookingService.confirmAccess);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["booking", token], queryFn: () => get({ data: { token } }), retry: false });
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  return <QueryState q={q} skeleton={<CustomerTokenPage eyebrow="BOOKING" title="Loading your booking…" description=""><div className="h-40 animate-pulse rounded-md bg-muted"/></CustomerTokenPage>}>{({ job }) => {
    if (!job) return <CustomerTokenPage eyebrow="BOOKING" title="This link isn't valid." description="The booking may have been removed. Please contact Ekström VVS."><span/></CustomerTokenPage>;
    const when = job.scheduled_at ? `${fmtDay(job.scheduled_at)} · ${fmtRange(job.scheduled_at, job.duration_min)}` : "Time to be agreed — Mats will contact you";
    const canSet = job.status === "confirmed" || job.status === "access_confirmed";
    return <CustomerTokenPage eyebrow={`BOOKING ${job.ref}`} title={canSet ? "Will someone be able to let us in?" : job.title} description={`${job.title} · ${when}`}>
      {canSet ? <><div className="grid gap-3">{ACCESS_OPTIONS.map((label, i) => { const Icon = icons[i]!; const sel = job.access_status === label; return <button key={label} disabled={!!saving} onClick={async () => { setSaving(label); setError(""); try { await confirm({ data: { token, choice: label } }); await qc.invalidateQueries({ queryKey: ["booking", token] }); } catch (e) { setError(errMsg(e)); } finally { setSaving(""); } }} className={cn("grid min-h-20 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-md border bg-card p-4 text-left transition-all hover:-translate-y-0.5", sel && "border-success bg-success/5 ring-2 ring-success/15")}><span className="grid size-11 place-items-center rounded-md bg-muted text-primary"><Icon/></span><span className="font-semibold">{saving === label ? "Saving…" : label}</span>{sel && <Check className="text-success"/>}</button>; })}</div>
        {job.access_status && <p role="status" className="mt-5 text-center text-sm font-semibold text-success">Saved: {job.access_status}. Mats has been informed.</p>}{error && <div className="mt-4"><ErrorState message={error}/></div>}
        <Button asChild variant="ghost" className="mt-4 w-full"><Link to="/reschedule/$token" params={{ token }}>Need another time? Reschedule</Link></Button></>
      : <p className="rounded-md border bg-card p-5 text-sm">Status: <strong>{job.status.replaceAll("_", " ")}</strong>. {job.status === "needs_assessment" || job.status === "new" ? "We've received your request and will contact you soon." : "Contact Ekström VVS if you have questions."}</p>}
    </CustomerTokenPage>;
  }}</QueryState>;
}
