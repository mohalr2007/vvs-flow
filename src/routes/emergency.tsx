import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, Camera, Clock3, Phone, ShieldCheck } from "lucide-react";
import { CustomerShell } from "@/components/vvs/customer-shell";
import { ErrorState } from "@/components/vvs/primitives";
import { errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bookingService } from "@/lib/services";
import { uploadPhoto } from "@/lib/upload";
import { fmtTime } from "@/lib/time";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "Emergency plumbing — Ekström VVS" }, { name: "description", content: "Request the fastest available plumbing response in Västerås." }, { property: "og:title", content: "Emergency plumbing — Ekström VVS" }, { property: "og:description", content: "Share what is happening and see a realistic response window." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Emergency,
});

type Result = Awaited<ReturnType<typeof bookingService.create>>;

function Emergency() {
  const create = useServerFn(bookingService.create);
  const [f, setF] = useState({ name: "", phone: "", email: "", address: "", description: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const ok = f.name.trim() && f.phone.replace(/\D/g, "").length >= 7 && f.address.trim().length > 5 && f.description.trim().length > 3;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const photoPath = photo ? await uploadPhoto(photo) : null;
      setResult(await create({ data: { kind: "emergency", ...f, title: "Emergency leak", urgency: "Emergency", duration_min: 90, price_high: null, confidence: null, missing_fields: null, slotStart: null, photoPath } }));
    } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  }
  return <CustomerShell minimal><div className="mx-auto max-w-lg px-6 py-12 pb-32"><div className="inline-flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3"><span className="relative size-2.5 rounded-full bg-destructive after:absolute after:inset-0 after:rounded-full after:bg-destructive after:animate-pulse-ring"/><span className="figma-label text-[10px] text-destructive">Urgent request</span></div><h1 className="mt-7 font-display text-4xl font-light leading-tight">We're here.<br/>Tell us what's happening.</h1><p className="mt-3 leading-7 text-muted-foreground">Fill this out and Mats will be dispatched as fast as possible. Your arrival window is calculated in real time.</p>
    {result?.eta ? <Card className="mt-8 border-destructive/20 bg-destructive/5 p-8 text-center shadow-none animate-scale-in" role="status"><div className="relative mx-auto grid size-20 place-items-center rounded-full border-2 border-destructive/30 bg-destructive/10"><Clock3 className="size-8 text-destructive"/><span className="absolute inset-0 rounded-full border border-destructive/30 animate-pulse-ring"/></div><p className="figma-label mt-6 text-[10px] text-destructive">Estimated arrival window</p><p className="mt-2 font-display text-5xl font-light">{fmtTime(result.eta.from)}–{fmtTime(result.eta.to)}</p><p className="mt-3 text-sm text-muted-foreground">Based on current workload and travel zone. Reference {result.ref}.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><a href="tel:+4621000000"><Phone/>Call Ekström VVS</a></Button>{result.accessToken && <Button asChild variant="outline"><Link to="/access/$token" params={{ token: result.accessToken }}>View request</Link></Button>}</div></Card>
    : <form onSubmit={submit} className="mt-8 space-y-4"><Field label="Name" id="n"><Input id="n" className="h-12" autoComplete="name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })}/></Field><Field label="Phone" id="p"><Input id="p" className="h-12" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}/></Field><Field label="Email (optional)" id="e"><Input id="e" className="h-12" type="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}/></Field><Field label="Address" id="a"><Input id="a" className="h-12" autoComplete="street-address" placeholder="Street, postcode, Västerås" value={f.address} onChange={e => setF({ ...f, address: e.target.value })}/></Field><Field label="What is happening?" id="w"><Textarea id="w" className="min-h-28" maxLength={1500} placeholder="Water is leaking under the sink…" value={f.description} onChange={e => setF({ ...f, description: e.target.value })}/></Field><label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground"><Camera className="size-5"/>{photo ? `Photo added: ${photo.name}` : "Add a photo (optional)"}<input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)}/></label><div className="rounded-md bg-muted p-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mr-2 inline size-4"/>If water is near electricity, keep clear. If safe, turn off the nearest shutoff valve.</div>{error && <ErrorState message={error}/>}<Button type="submit" size="lg" className="sticky bottom-3 z-20 w-full shadow-lg" disabled={loading || !ok}>{loading ? "Checking current availability…" : "Find emergency availability"}</Button></form>}</div></CustomerShell>;
}
function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div><Label htmlFor={id} className="mb-2 block">{label}</Label>{children}</div>; }
