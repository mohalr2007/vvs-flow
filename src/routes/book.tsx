import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Home, MapPin, Sparkles, Wrench, Droplets, ShieldCheck, Clock3, Camera, AlertTriangle } from "lucide-react";
import { CustomerShell } from "@/components/vvs/customer-shell";
import { ProgressStepper, ErrorState } from "@/components/vvs/primitives";
import { errMsg } from "@/components/vvs/query-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bookingService } from "@/lib/services";
import { uploadPhoto } from "@/lib/upload";
import { downloadIcs } from "@/lib/ics";
import type { SlotGroup } from "@/lib/vvs-data";
import { fmtDay, fmtRange, fmtShortDay, fmtTime, sek } from "@/lib/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [{ title: "Book plumbing service — Ekström VVS" }, { name: "description", content: "Describe your plumbing need and choose an available time in Västerås." }, { property: "og:title", content: "Book plumbing service — Ekström VVS" }, { property: "og:description", content: "A simple guided plumbing booking experience." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Book,
});

type Ai = { title: string; summary: string; urgency: "Low" | "Normal" | "High" | "Emergency"; duration_min: number; price_low: number; price_high: number; confidence: number; needs_site_visit: boolean; location_hint: string | null; missing_fields: string[] };
type Done = Awaited<ReturnType<typeof bookingService.create>>;

function Book() {
  const navigate = useNavigate();
  const understand = useServerFn(bookingService.understand), getSlots = useServerFn(bookingService.slots), create = useServerFn(bookingService.create);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<"repair" | "project" | null>(null);
  const [leaking, setLeaking] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [ai, setAi] = useState<Ai | null>(null);
  const [aiError, setAiError] = useState("");
  const [thinking, setThinking] = useState(false);
  const [contact, setContact] = useState({ name: "", address: "", phone: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [groups, setGroups] = useState<SlotGroup[] | null>(null);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  const isProject = service === "project";
  const lowConfidence = !!ai && ai.confidence < 60 && !isProject;
  const manual = !ai && !!aiError;
  const skipTime = isProject || lowConfidence || manual;
  const steps = skipTime ? ["Service", "Details", "Location", "Confirm"] : ["Service", "Details", "Location", "Time", "Confirm"];
  const confirmStep = steps.length - 1;
  const contactOk = contact.name.trim() && contact.address.trim().length > 5 && contact.phone.replace(/\D/g, "").length >= 7;

  async function runAi() {
    setThinking(true); setAi(null); setAiError("");
    try { const r = await understand({ data: { message, kind: isProject ? "project" : "repair" } }); if ("data" in r) setAi(r.data); else setAiError(r.error); }
    catch (e) { setAiError(errMsg(e)); } finally { setThinking(false); }
  }
  async function loadSlots() {
    setGroups(null); setSlot(""); setError("");
    try { setGroups((await getSlots({ data: { duration: ai?.duration_min ?? 60, address: contact.address } })).groups); } catch (e) { setError(errMsg(e)); setGroups([]); }
  }
  async function submit() {
    setBusy(true); setError("");
    try {
      const photoPath = photo ? await uploadPhoto(photo) : null;
      const r = await create({ data: { kind: isProject ? "project" : "repair", ...contact, description: message, title: ai?.title ?? null, urgency: ai?.urgency ?? null, duration_min: ai?.duration_min ?? null, price_high: ai?.price_high ?? null, confidence: ai?.confidence ?? null, missing_fields: ai?.missing_fields ?? null, slotStart: skipTime ? null : slot, photoPath } });
      setDone(r);
    } catch (e) {
      setError(errMsg(e));
      if (!skipTime) { setStep(3); void loadSlots(); }
    } finally { setBusy(false); }
  }
  function next() {
    if (step === 0 && leaking) { navigate({ to: "/emergency" }); return; }
    if (step === confirmStep) { void submit(); return; }
    if (step === 2 && !skipTime) void loadSlots();
    setStep(s => s + 1);
  }
  const canNext = (step === 0 && !!service && (isProject || leaking !== null)) || (step === 1 && (!!ai || manual)) || (step === 2 && !!contactOk) || (step === 3 && !skipTime && !!slot) || (step === confirmStep && !busy);

  return <CustomerShell minimal><div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">{!done && <ProgressStepper steps={steps} current={step}/>}<div className={cn("mx-auto mt-10", step === 0 && !done ? "grid max-w-5xl items-stretch gap-8 lg:grid-cols-[.72fr_1.28fr]" : "max-w-2xl")}>
    {step === 0 && !done && <aside className="order-2 flex flex-col justify-between rounded-md bg-owner p-6 text-owner-foreground lg:order-1 lg:p-8"><div><p className="text-sm font-semibold text-primary">Ekström VVS</p><h2 className="mt-3 text-3xl font-bold">Professional help, from the first question.</h2><p className="mt-4 text-sm leading-6 text-owner-foreground/65">Your answers help us prepare the right tools and time before we arrive.</p></div><div className="mt-10 space-y-4 border-t border-owner-foreground/15 pt-6 text-sm text-owner-foreground/75"><p className="flex items-center gap-3"><ShieldCheck className="size-5 text-success"/>Certified and insured</p><p className="flex items-center gap-3"><Clock3 className="size-5 text-primary"/>Usually takes under 3 minutes</p></div></aside>}
    <div className={step === 0 && !done ? "order-1 rounded-md border bg-card p-6 shadow-sm lg:order-2 lg:p-8" : ""}>{done ? <Confirmation done={done} ai={ai} address={contact.address}/> : <>
      {step === 0 && <section className="animate-in fade-in slide-in-from-right-3"><Header title="What type of service do you need?" text="Choose the option that best describes your situation."/><div className="mt-8 grid gap-4 sm:grid-cols-2"><Choice active={service === "repair"} icon={<Wrench/>} title="Repair / Emergency" text="Something needs fixing." onClick={() => { setService("repair"); setAi(null); }}/><Choice active={isProject} icon={<Home/>} title="New Installation / Renovation" text="You're planning a new installation or renovation." onClick={() => { setService("project"); setLeaking(null); setAi(null); }}/></div>{service === "repair" && <div className="mt-8 animate-in fade-in"><h2 className="text-center text-xl font-bold">Is water leaking right now?</h2><div className="mt-4 grid grid-cols-2 gap-3"><Button size="lg" variant={leaking === true ? "destructive" : "outline"} onClick={() => setLeaking(true)}><Droplets/>Yes — Emergency</Button><Button size="lg" variant={leaking === false ? "default" : "outline"} onClick={() => setLeaking(false)}>No</Button></div></div>}</section>}
      {step === 1 && <section className="animate-in fade-in slide-in-from-right-3"><Header title={isProject ? "Tell us about your project" : "What's happening?"} text="Write naturally — a short description is enough."/><div className="mt-7"><Label htmlFor="request">Your description</Label><Textarea id="request" value={message} maxLength={1500} onChange={e => { setMessage(e.target.value); setAi(null); setAiError(""); }} className="mt-2 min-h-32 text-base" placeholder={isProject ? "We want to renovate our bathroom and add floor heating." : "Our kitchen sink is leaking and there's water under the cabinet."}/><Button className="mt-3" variant="secondary" disabled={message.trim().length < 8 || thinking} onClick={runAi}><Sparkles/>{thinking ? "Understanding…" : "Understand request"}</Button>
        <div aria-live="polite">{thinking && <div className="mt-5 flex items-center gap-3 rounded-md bg-muted p-4 text-sm text-muted-foreground"><Sparkles className="size-4 animate-pulse-soft text-primary"/>Understanding your request…</div>}
        {aiError && <div className="mt-5 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4"/>{aiError}</p><p className="mt-1 text-muted-foreground">You can continue — Mats will review your request personally.</p></div>}
        {ai && <Card className="mt-5 rounded-md border-primary/20 p-5 shadow-none animate-in fade-in"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-primary">REQUEST UNDERSTOOD</p><h3 className="mt-2 text-xl font-bold">{ai.title}</h3><p className="mt-1 text-sm text-muted-foreground">{ai.summary}</p></div><Check className="size-6 shrink-0 text-success"/></div><div className="mt-5 grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Urgency</p><p className="mt-1 font-semibold">{ai.urgency}</p></div><div><p className="text-muted-foreground">Estimated service</p><p className="mt-1 font-semibold">{isProject || lowConfidence ? "Site visit" : `${ai.duration_min} min`}</p></div></div>{lowConfidence && <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm">This request needs a quick assessment. Mats will contact you to agree on the right time.</p>}{ai.missing_fields.length > 0 && <p className="mt-5 border-t pt-4 text-sm">We just need: {ai.missing_fields.join(" · ")}</p>}</Card>}</div></div></section>}
      {step === 2 && <section className="animate-in fade-in"><Header title="Where should we come?" text="This helps us show times that fit the current route."/><div className="mt-7 space-y-4"><div><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" value={contact.name} onChange={e => setContact({ ...contact, name: e.target.value })} className="mt-2 h-12"/></div><div><Label htmlFor="address">Service address</Label><div className="relative mt-2"><MapPin className="absolute left-3 top-3.5 size-5 text-muted-foreground"/><Input id="address" autoComplete="street-address" placeholder="Street, postcode, Västerås" value={contact.address} onChange={e => setContact({ ...contact, address: e.target.value })} className="h-12 pl-10"/></div></div><div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" autoComplete="tel" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} className="mt-2 h-12"/></div><label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground"><Camera className="size-5"/>{photo ? `Photo added: ${photo.name}` : "Add a photo (optional)"}<input type="file" accept="image/*" className="sr-only" onChange={e => setPhoto(e.target.files?.[0] ?? null)}/></label></div></section>}
      {step === 3 && !skipTime && <section className="animate-in fade-in"><Header title="Available times" text="Times are based on the current schedule and travel zones."/><div className="mt-7 space-y-6">{groups === null ? <div className="space-y-3">{[0, 1].map(i => <div key={i} className="h-14 animate-pulse rounded-md bg-muted"/>)}</div> : groups.length === 0 ? <p className="rounded-md bg-muted p-4 text-sm">No free times in the next days. Go back and continue without a time — we'll contact you.</p> : groups.map(g => <div key={g.day}><h3 className="mb-3 font-semibold">{fmtDay(g.day)}</h3>{[["Morning", (h: number) => h < 12], ["Afternoon", (h: number) => h >= 12 && h < 17], ["Evening", (h: number) => h >= 17]].map(([label, test]) => { const list = g.slots.filter(s => (test as (h: number) => boolean)(Number(fmtTime(s.start).slice(0, 2)))); return list.length === 0 ? null : <div key={label as string} className="mb-4"><p className="mb-2 text-xs font-semibold text-muted-foreground">{label as string}</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{list.map(s => <button key={s.start} onClick={() => setSlot(s.start)} className={cn("min-h-16 rounded-md border bg-card px-2 text-sm transition-all hover:-translate-y-0.5", slot === s.start && "border-primary bg-accent text-accent-foreground ring-2 ring-primary/15")}><span className="block font-semibold">{fmtTime(s.start)}</span><span className="block text-[11px] text-muted-foreground">{s.travel}</span></button>)}</div></div>)}{slot && <div className="rounded-md bg-success/8 p-4 text-sm"><p className="font-semibold text-success">{fmtShortDay(slot)} · {fmtTime(slot)} is available</p><p className="mt-1 text-muted-foreground">Held for you until you confirm.</p></div>}{error && <ErrorState message={error}/>}</div></section>}
      {step === confirmStep && <section className="animate-in fade-in"><Header title="Check your request" text="Nothing is confirmed until you press the button below."/><Card className="mt-7 rounded-md p-5 shadow-none"><dl className="grid gap-4 text-sm sm:grid-cols-2">{[["Service", ai?.title ?? (isProject ? "Project request" : "Plumbing request")], ["Address", contact.address], ["Time", skipTime ? (isProject ? "Site visit — we'll contact you" : "We'll contact you to agree a time") : `${fmtDay(slot)} · ${fmtRange(slot, ai?.duration_min ?? 60)}`], ["Duration", isProject || !ai ? "To be assessed" : `${ai.duration_min} min`], ["Estimated price", ai && ai.price_high ? `${sek(ai.price_low)}–${sek(ai.price_high)}` : isProject ? "Site visit free of charge" : "After assessment"], ["Note", "Estimated price — not a binding quote"]].map(([a, b]) => <div key={a}><dt className="text-muted-foreground">{a}</dt><dd className="mt-1 font-semibold">{b}</dd></div>)}</dl></Card>{error && <div className="mt-5"><ErrorState message={error}/></div>}</section>}
      <div className="mt-10 flex justify-between gap-3">{step > 0 ? <Button variant="ghost" disabled={busy} onClick={() => setStep(v => v - 1)}><ArrowLeft/>Back</Button> : <span/>}<Button disabled={!canNext} onClick={next}>{step === confirmStep ? (busy ? "Sending…" : skipTime ? "Send request" : "Confirm booking") : "Continue"}<ArrowRight/></Button></div>
    </>}</div></div></div></CustomerShell>;
}
function Header({ title, text }: { title: string; text: string }) { return <div className="text-center"><h1 className="text-3xl font-bold sm:text-4xl">{title}</h1><p className="mx-auto mt-3 max-w-lg text-muted-foreground">{text}</p></div>; }
function Choice({ active, icon, title, text, onClick }: { active: boolean; icon: React.ReactNode; title: string; text: string; onClick: () => void }) { return <button onClick={onClick} aria-pressed={active} className={cn("min-h-52 rounded-md border bg-card p-6 text-left transition-all hover:-translate-y-1 hover:surface-shadow", active && "border-primary ring-2 ring-primary/15")}><span className={cn("grid size-12 place-items-center rounded-md bg-muted text-primary", active && "bg-primary text-primary-foreground")}>{icon}</span><h2 className="mt-7 text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p></button>; }
function Confirmation({ done, ai, address }: { done: Done; ai: Ai | null; address: string }) {
  const booked = done.type === "booked" && done.scheduledAt;
  const duration = ai?.duration_min ?? 60;
  return <div className="py-8 text-center animate-in fade-in"><div className="mx-auto grid size-20 place-items-center rounded-full bg-success text-success-foreground animate-success"><Check className="size-10"/></div><h1 className="mt-6 text-4xl font-bold">{booked ? "You're booked." : "Request received."}</h1><p className="mt-2 text-lg text-muted-foreground">{booked ? `${fmtDay(done.scheduledAt!)} · ${fmtRange(done.scheduledAt!, duration)}` : done.type === "project" ? "Mats will contact you to plan a site visit." : "Mats will review your request and contact you personally."}</p><p className="mt-1 text-sm text-muted-foreground">Reference {done.ref}</p>
    <Card className="mx-auto mt-8 max-w-lg rounded-md p-6 text-left shadow-none"><h2 className="font-bold">{ai?.title ?? "Your request"}</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Address</dt><dd className="text-right font-medium">{address}</dd></div>{booked && <div className="flex justify-between"><dt className="text-muted-foreground">Estimated duration</dt><dd className="font-medium">{duration} min</dd></div>}{ai?.price_high ? <div className="flex justify-between"><dt className="text-muted-foreground">Estimated price</dt><dd className="font-medium">{sek(ai.price_low)}–{sek(ai.price_high)}</dd></div> : null}</dl><p className="mt-4 text-xs text-muted-foreground">Estimated price — not a binding quote.</p></Card>
    <div className="mt-6 flex flex-wrap justify-center gap-3">{done.accessToken && <Button asChild><Link to="/access/$token" params={{ token: done.accessToken }}>View booking</Link></Button>}{booked && <Button variant="outline" onClick={() => downloadIcs({ title: `Ekström VVS — ${ai?.title ?? "Plumbing visit"}`, start: done.scheduledAt!, minutes: duration, location: address })}>Add to calendar</Button>}</div>
    {done.accessToken && <p className="mt-4 text-xs text-muted-foreground">Save this page's link — it's your private booking link.</p>}</div>;
}
