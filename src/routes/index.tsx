import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Droplets,
  Gauge,
  MapPin,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { CustomerShell } from "@/components/vvs/customer-shell";
import { Button } from "@/components/ui/button";
import heroAsset from "@/assets/vvs-figma-hero.jpg.asset.json";
import toolsAsset from "@/assets/vvs-figma-tools.jpg.asset.json";
import inspectionImage from "@/assets/plumbing-inspection.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ekström VVS — Trusted plumbing in Västerås" },
      { name: "description", content: "Book trusted plumbing service in Västerås with clear availability and fast answers." },
      { property: "og:title", content: "Ekström VVS — Trusted plumbing in Västerås" },
      { property: "og:description", content: "Describe what you need and find the right service and next available time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const process: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Wrench, title: "Describe the job", text: "Tell us what happened in your own words. No technical knowledge needed." },
  { icon: CalendarCheck, title: "Choose a time", text: "See practical arrival windows based on our actual workload." },
  { icon: ShieldCheck, title: "Stay informed", text: "Get one clear place for access details, changes and confirmation." },
];

const trustPoints: { icon: React.ReactNode; value: string; label: string }[] = [
  {
    icon: <Gauge />,
    value: "4.9 / 5",
    label: "Customer satisfaction",
  },
  {
    icon: <MapPin />,
    value: "Västerås",
    label: "Local service area",
  },
  {
    icon: <Clock3 />,
    value: "Same day",
    label: "Emergency availability",
  },
];

function Home() {
  return (
    <CustomerShell>
      <section className="relative flex min-h-screen items-center overflow-hidden bg-owner text-owner-foreground">
        <img src={heroAsset.url} alt="Plumbing tools and bathroom pipes" className="absolute inset-0 size-full object-cover object-center opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-owner via-owner/80 to-owner/20" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-owner to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-24">
          <div className="max-w-2xl animate-fade-up">
            <p className="figma-label mb-8 flex items-center gap-3 text-[11px] text-primary"><span className="h-0.5 w-8 bg-primary"/>Västerås · Est. 1994</p>
            <h1 className="max-w-2xl font-display text-5xl font-light leading-[1.05] sm:text-7xl lg:text-[88px]">Plumbing done<br/><em className="font-light text-primary">right.</em></h1>
            <p className="mt-6 max-w-lg text-lg leading-7 text-owner-foreground/65">Answers without delay. Real arrival windows — travel time included. One plumber, full accountability.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-52 rounded-xl"><Link to="/book">Book a service <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="destructive" className="min-w-52 rounded-xl"><Link to="/emergency"><Droplets/>Emergency help</Link></Button>
            </div>
          </div>
        </div>
        <div className="figma-label absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-[9px] text-primary/60 sm:block">Scroll<div className="mx-auto mt-2 h-8 w-px bg-gradient-to-b from-primary to-transparent"/></div>
      </section>

      <section className="border-y border-primary/15 bg-secondary/30 px-6 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-primary/15">
          {trustPoints.map((point) => <Trust key={point.label} {...point} />)}
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-6 py-24">
        <img src={inspectionImage} alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-20 size-full object-cover opacity-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background/85 to-background"/>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center"><p className="figma-label text-[10px] text-primary">How it works</p><h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">Three steps to sorted.</h2></div>
          <div className="grid gap-6 md:grid-cols-3">
              {process.map(({ icon: Icon, title, text }, index) => (
                <div key={title} className="figma-glass rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:figma-glow">
                  <div className="mb-6 flex items-center justify-between"><span className="figma-label text-[10px] text-primary">0{index + 1}</span><Icon className="size-6 text-primary"/></div>
                  <h3 className="font-display text-2xl font-normal">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
                </div>
              ))}
          </div>
          <div className="mt-14 text-center"><Button asChild size="lg" className="rounded-xl"><Link to="/book">Start booking <ArrowRight/></Link></Button></div>
        </div>
      </section>

      <section className="border-y border-primary/10 bg-secondary/15 px-6 py-20"><div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2"><div><p className="figma-label text-[10px] text-copper">Our promise</p><h2 className="mt-5 font-display text-4xl font-light leading-tight">Honest estimates.<br/>No surprise invoices.</h2><p className="mt-5 leading-7 text-muted-foreground">We give you a price range before we arrive — never a binding quote that could go wrong. Mats approves every job personally.</p><ul className="mt-7 space-y-3 text-sm">{["Price estimate shown before you confirm","Real arrival windows — travel time included","ROT tax deduction handled for you","One plumber. Full responsibility."].map(x => <li key={x} className="flex gap-3"><CheckCircle2 className="size-4 text-primary"/>{x}</li>)}</ul></div><div className="relative aspect-[4/3] overflow-hidden rounded-2xl"><img src={heroAsset.url} alt="Plumbing installation and tools" className="size-full object-cover"/><div className="absolute inset-0 bg-gradient-to-br from-transparent to-owner/70"/><div className="figma-glass absolute inset-x-4 bottom-4 rounded-xl p-4"><p className="figma-label text-[9px] text-primary">Estimate range</p><p className="mt-1 font-display text-2xl">2 200 – 3 400 SEK</p><p className="mt-1 text-xs text-muted-foreground">ROT deduction may apply</p></div></div></div></section>

      <section className="relative h-72 overflow-hidden"><img src={toolsAsset.url} alt="Organized plumbing tools and fittings" className="size-full object-cover opacity-85"/><div className="absolute inset-0 bg-owner/45"/><div className="absolute inset-0 grid place-items-center px-6 text-center"><div><p className="font-display text-2xl font-light italic text-primary sm:text-3xl">“Every inquiry gets an outcome.”</p><p className="figma-label mt-4 text-[10px] text-copper">Mats Ekström · Owner, Ekström VVS</p></div></div></section>

      <section className="px-6 py-20 text-center"><h2 className="font-display text-4xl font-light sm:text-5xl">Ready when you are.</h2><p className="mt-4 text-muted-foreground">Book in minutes. Arrive with certainty.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg" className="rounded-xl"><Link to="/book">Book a service</Link></Button><Button asChild size="lg" variant="outline" className="rounded-xl"><Link to="/emergency">Emergency line</Link></Button></div></section>
    </CustomerShell>
  );
}

function Trust({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <article className="min-w-0 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <span className="mx-auto mb-2 grid size-9 place-items-center text-primary">{icon}</span>
      <p className="font-display text-3xl font-light text-primary">{value}</p><p className="figma-label mt-1 text-[9px] text-muted-foreground">{label}</p>
    </article>
  );
}