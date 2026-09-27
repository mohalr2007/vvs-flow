import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, CheckCircle2, Plus } from "lucide-react";
import { PageHeader, StatusBadge, ErrorState, AIConfidenceBadge } from "@/components/vvs/primitives";
import { errMsg } from "@/components/vvs/query-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { aiService, jobService } from "@/lib/services";
import { sek } from "@/lib/time";

export const Route = createFileRoute("/dashboard/inbox")({
  head: () => ({ meta: [{ title: "Inbox Simulator — VVS Flow" }, { name: "description", content: "Demo how customer messages can become structured service requests." }, { property: "og:title", content: "Inbox Simulator — VVS Flow" }, { property: "og:description", content: "An integration-ready request understanding demonstration." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Inbox,
});

type Result = Awaited<ReturnType<typeof aiService.inbox>>;

function Inbox() {
  const understand = useServerFn(aiService.inbox), create = useServerFn(jobService.fromInbox);
  const navigate = useNavigate();
  const [text, setText] = useState("Hello, our toilet has been leaking since yesterday and the floor is getting wet. We live in Gideonsberg.");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const data = res && "data" in res ? res.data : null;
  return <div className="mx-auto max-w-5xl space-y-7 animate-fade-up"><PageHeader title="Message Inbox" description="Paste a raw customer message — AI turns it into a structured job request for review." action={<StatusBadge tone="info">Demo / Integration-ready</StatusBadge>}/>
    <div className="grid gap-6 xl:grid-cols-2"><section><label className="figma-label text-[10px] text-muted-foreground" htmlFor="message">Raw message</label><Textarea id="message" value={text} maxLength={2000} onChange={e => { setText(e.target.value); setRes(null); }} className="mt-3 min-h-56"/><Button className="mt-4 w-full rounded-xl py-6" disabled={busy || !text.trim()} onClick={async () => { setBusy(true); setRes(null); try { setRes(await understand({ data: { text } })); } catch (e) { setRes({ error: errMsg(e) }); } finally { setBusy(false); } }}><Sparkles className={busy ? "animate-ticker" : ""}/>{busy ? "Understanding…" : "Understand request"}</Button><p className="mt-4 text-xs text-muted-foreground">Messages are pasted manually to demonstrate the intake flow.</p></section>
      <Card className="rounded-2xl border-dashed p-6 shadow-none" aria-live="polite">{busy ? <div className="grid min-h-64 place-items-center text-sm text-muted-foreground"><div className="text-center"><Sparkles className="mx-auto mb-3 size-7 animate-ticker text-primary"/>Structuring request…</div></div>
        : res && "error" in res ? <ErrorState message={res.error}/>
        : data ? <div className="animate-scale-in"><div className="flex items-center justify-between gap-2"><span className="figma-label flex items-center gap-2 text-[10px] text-primary"><CheckCircle2/>Structured request</span><AIConfidenceBadge value={data.confidence}/></div><p className="mt-4 text-sm text-muted-foreground">{data.summary}</p><dl className="mt-6 divide-y divide-border">{[["Job type", data.title], ["Urgency", data.urgency], ["Location", data.location_hint ?? "Not mentioned"], ["Duration", `${data.duration_min} min`], ["Estimate", data.price_high ? `${sek(data.price_low)}–${sek(data.price_high)}` : "Site visit"], ["Missing", data.missing_fields.join(", ") || "Nothing"]].map(([a, b]) => <div key={a} className="flex items-center justify-between gap-4 py-3"><dt className="text-sm text-muted-foreground">{a}</dt><dd className="text-right text-sm font-semibold">{b}</dd></div>)}</dl>
          <Button className="mt-6" variant="outline" onClick={async () => { try { const r = await create({ data: { text, title: data.title, urgency: data.urgency, duration_min: data.duration_min, value: data.price_high, confidence: data.confidence, location: data.location_hint, missing: data.missing_fields } }); toast.success("Job created for review"); navigate({ to: "/dashboard/jobs/$jobId", params: { jobId: r.id } }); } catch (e) { toast.error(errMsg(e)); } }}><Plus/>Create job for review</Button></div>
        : <div className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground"><div><Sparkles className="mx-auto mb-3 size-7"/>Structured details will appear here.</div></div>}</Card></div></div>;
}
