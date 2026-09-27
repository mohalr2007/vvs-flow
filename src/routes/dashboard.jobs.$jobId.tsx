import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Save, XCircle, PlayCircle, CheckCircle2, ListPlus, Phone, MapPin } from "lucide-react";
import { AIConfidenceBadge, PageHeader, StatusBadge, EmptyState } from "@/components/vvs/primitives";
import { QueryState, errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { jobService } from "@/lib/services";
import { statusLabel, statusTone, type Job, type SlotGroup } from "@/lib/vvs-data";
import { fmtDay, fmtShortDay, fmtTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/jobs/$jobId")({
  head: () => ({ meta: [{ title: "Review job — VVS Flow" }, { name: "description", content: "Review AI-assisted job details with human approval." }, { property: "og:title", content: "Review job — VVS Flow" }, { property: "og:description", content: "Inspect and approve a plumbing service request." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Review,
});

function Review() {
  const { jobId } = Route.useParams();
  const get = useServerFn(jobService.get);
  const q = useQuery({ queryKey: ["job", jobId], queryFn: () => get({ data: { id: jobId } }) });
  return <div className="mx-auto max-w-4xl space-y-6 animate-fade-up"><Button asChild variant="ghost" size="sm"><Link to="/dashboard/jobs"><ArrowLeft/>Jobs</Link></Button>
    <QueryState q={q}>{(d) => d.job ? <Editor job={d.job} photoUrl={d.photoUrl}/> : <EmptyState title="Job not found" description="It may have been removed or the demo was reset."/>}</QueryState></div>;
}

function Editor({ job, photoUrl }: { job: Job; photoUrl: string | null }) {
  const qc = useQueryClient();
  const save = useServerFn(jobService.save), approve = useServerFn(jobService.approve), schedule = useServerFn(jobService.schedule), setStatus = useServerFn(jobService.setStatus);
  const [f, setF] = useState({ title: job.title, urgency: job.urgency as "Normal", duration_min: job.duration_min, zone: job.zone, value: job.value, description: job.description, site_visit: job.site_visit });
  useEffect(() => { setF({ title: job.title, urgency: job.urgency as "Normal", duration_min: job.duration_min, zone: job.zone, value: job.value, description: job.description, site_visit: job.site_visit }); }, [job]);
  const [groups, setGroups] = useState<SlotGroup[] | null>(null);
  const [busy, setBusy] = useState("");
  const uncertain = job.confidence < 60;
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["job", job.id] }), qc.invalidateQueries({ queryKey: ["jobs"] }), qc.invalidateQueries({ queryKey: ["overview"] })]);
  const run = async (label: string, fn: () => Promise<unknown>, ok?: string) => { setBusy(label); try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(""); } };
  const valid = f.title.trim() && f.duration_min >= 15;
  const open = ["new", "qualified", "needs_assessment", "held"].includes(job.status);

  return <>
    <PageHeader eyebrow={uncertain ? "NEEDS ASSESSMENT" : `JOB REVIEW · ${job.ref}`} title={job.customer_name} description={job.address || "Review the structured job request."} action={<div className="flex flex-wrap items-center justify-end gap-2"><StatusBadge tone={statusTone(job.status)}>{statusLabel(job.status)}</StatusBadge><AIConfidenceBadge value={job.confidence}/></div>}/>
    {uncertain && open && <div className="rounded-md border border-warning/40 bg-warning/10 p-5"><StatusBadge tone="warning">Manual review required</StatusBadge><p className="mt-3 text-sm">The request is unusual. Confirm the work type, duration and whether a site visit is needed before approving.</p>{job.missing_fields.length > 0 && <p className="mt-2 text-sm text-muted-foreground">Missing: {job.missing_fields.join(" · ")}</p>}</div>}
    <div className="grid gap-5 xl:grid-cols-[1fr_.7fr]">
      <Card className="rounded-2xl p-5 shadow-none"><h2 className="mb-5 font-display text-lg font-normal">Job details</h2><div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 border-b pb-4 text-sm">{job.phone && <a className="flex items-center gap-1 text-primary" href={`tel:${job.phone}`}><Phone className="size-4"/>{job.phone}</a>}{job.address && <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-4"/>{job.address}</span>}{job.scheduled_at && <span className="text-muted-foreground">{fmtDay(job.scheduled_at)} · {fmtTime(job.scheduled_at)}</span>}{job.access_status && <span className="text-muted-foreground">Access: {job.access_status}</span>}</div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Job type" id="t"><Input id="t" value={f.title} onChange={e => setF({ ...f, title: e.target.value })}/></Field><Field label="Urgency" id="u"><select id="u" value={f.urgency} onChange={e => setF({ ...f, urgency: e.target.value as "Normal" })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{["Low", "Normal", "High", "Emergency"].map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Duration (min)" id="d"><Input id="d" type="number" min={15} step={15} value={f.duration_min} onChange={e => setF({ ...f, duration_min: Number(e.target.value) })}/></Field><Field label="Zone" id="z"><Input id="z" value={f.zone} onChange={e => setF({ ...f, zone: e.target.value })}/></Field><Field label="Estimate (SEK)" id="v"><Input id="v" type="number" min={0} value={f.value} onChange={e => setF({ ...f, value: Number(e.target.value) })}/></Field><Field label="Site visit required" id="s"><select id="s" value={f.site_visit ? "Yes" : "No"} onChange={e => setF({ ...f, site_visit: e.target.value === "Yes" })} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option>No</option><option>Yes</option></select></Field></div>
        <div className="mt-5"><Label htmlFor="desc">Customer description</Label><Textarea id="desc" className="mt-2 min-h-28" value={f.description} onChange={e => setF({ ...f, description: e.target.value })}/></div>
        {photoUrl && <div className="mt-5"><p className="mb-2 text-sm font-medium">Customer photo</p><img src={photoUrl} alt="Photo uploaded by customer" className="max-h-72 rounded-md border object-cover"/></div>}
      </Card>
      <div className="space-y-5"><Card className="rounded-2xl border-primary/20 p-5 shadow-none"><p className="font-display text-lg font-normal">Decision</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Approving searches for suitable availability. No appointment is created until you pick a time.</p>
        <div className="mt-6 grid gap-3">{open && <Button variant="copper" className="rounded-xl" disabled={!valid || !!busy} onClick={() => run("approve", async () => { const r = await approve({ data: { id: job.id, fields: f } }); setGroups(r.groups); await refresh(); }, "Details approved")}><Check/>{busy === "approve" ? "Finding slots…" : "Approve & Find Slots"}</Button>}<Button variant="outline" disabled={!valid || !!busy} onClick={() => run("save", async () => { await save({ data: { id: job.id, fields: f } }); await refresh(); }, "Details saved")}><Save/>Save edited details</Button></div>
        {groups && <div className="mt-6 space-y-4 border-t pt-5">{groups.length ? groups.map(g => <div key={g.day}><p className="mb-2 text-sm font-semibold">{fmtShortDay(g.day)}</p><div className="grid grid-cols-2 gap-2">{g.slots.map(s => <button key={s.start} disabled={!!busy} onClick={() => run("schedule", async () => { await schedule({ data: { id: job.id, slotStart: s.start } }); setGroups(null); await refresh(); }, `Booked ${fmtShortDay(s.start)} ${fmtTime(s.start)}`)} className="rounded-md border p-2 text-left text-sm hover:border-primary hover:bg-accent"><span className="font-semibold">{fmtTime(s.start)}</span><span className="block text-xs text-muted-foreground">{s.travel}</span></button>)}</div></div>) : <p className="text-sm text-muted-foreground">No free slots in the next days. Consider moving the job to the waitlist.</p>}</div>}
      </Card>
      <Card className="rounded-xl bg-card/50 p-5 shadow-none"><p className="figma-label text-[10px] text-muted-foreground">Current status</p><p className="mt-2 font-display text-xl font-normal">{statusLabel(job.status)}</p><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {(job.status === "confirmed" || job.status === "access_confirmed") && <Btn icon={<PlayCircle/>} label="Start job" onClick={() => run("s", async () => { await setStatus({ data: { id: job.id, status: "in_progress" } }); await refresh(); }, "Job started")}/>}
        {job.status === "in_progress" && <Btn icon={<CheckCircle2/>} label="Mark completed" onClick={() => run("s", async () => { await setStatus({ data: { id: job.id, status: "completed" } }); await refresh(); }, "Completed — ROT summary prepared")}/>}
        {open && <Btn icon={<ListPlus/>} label="Move to waitlist" onClick={() => run("s", async () => { await setStatus({ data: { id: job.id, status: "waitlisted" } }); await refresh(); }, "Added to waitlist")}/>}
        {!["cancelled", "completed", "expired"].includes(job.status) && <Btn danger icon={<XCircle/>} label="Cancel appointment" onClick={() => { if (confirm("Cancel this job? A scheduled slot becomes recoverable from the waitlist.")) run("s", async () => { await setStatus({ data: { id: job.id, status: "cancelled" } }); await refresh(); }, "Cancelled — slot can be recovered"); }}/>}
      </div>{job.status === "cancelled" && job.scheduled_at && <Button asChild variant="link" className="mt-3 px-0"><Link to="/dashboard/waitlist">Recover this slot from the waitlist →</Link></Button>}</Card></div>
    </div></>;
}
function Btn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) { return <Button variant="outline" className={cn("justify-start", danger && "text-destructive hover:text-destructive")} onClick={onClick}>{icon}{label}</Button>; }
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div><Label htmlFor={id} className="figma-label mb-2 block text-[10px] text-muted-foreground">{label}</Label>{children}</div>; }
