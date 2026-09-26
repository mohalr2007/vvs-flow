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
import heroImage from "@/assets/ekstrom-plumber-hero.jpg";
import inspectionImage from "@/assets/plumbing-inspection.jpg";
import bathroomImage from "@/assets/plumbing-bathroom.jpg";

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
      <section className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-owner text-owner-foreground">
        <img src={heroImage} alt="Ekström VVS plumber inspecting a modern heating installation" width={1920} height={1080} className="absolute inset-0 size-full object-cover object-[68%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-owner via-owner/90 to-owner/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-owner/70 via-transparent to-owner/15" />
        <div className="relative mx-auto flex min-h-[calc(100svh-72px)] max-w-7xl items-end px-5 pb-16 pt-28 sm:items-center sm:py-24 lg:px-8">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold text-owner-foreground/70"><MapPin className="size-4 text-primary" />Local plumbing service in Västerås</p>
            <h1 className="max-w-xl text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">Plumbing done right. Answers without delay.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-owner-foreground/70 sm:text-lg">Repairs, emergencies and installations handled with precise arrival windows and clear communication from start to finish.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 px-6"><Link to="/book">Book a service <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-13 border-owner-foreground/25 bg-owner/35 text-owner-foreground hover:bg-owner-foreground/10 hover:text-owner-foreground"><Link to="/emergency"><Droplets className="text-destructive" />Emergency help</Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-owner-foreground/15 pt-5 text-sm text-owner-foreground/70">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" />Certified & insured</span>
              <span className="flex items-center gap-2"><Clock3 className="size-4 text-primary" />Clear arrival times</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b bg-owner px-5 py-16 text-owner-foreground lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3 sm:divide-x sm:divide-owner-foreground/20">
          {trustPoints.map((point) => <Trust key={point.label} {...point} />)}
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-owner px-5 py-20 text-owner-foreground lg:px-8 lg:py-28">
        <img src={inspectionImage} alt="" aria-hidden="true" loading="lazy" width={1408} height={912} className="bg-reveal absolute inset-0 -z-20 size-full object-cover object-[42%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-owner via-owner/90 to-owner/65" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold text-primary-foreground/80">A clearer way to book plumbing</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Every inquiry gets an outcome.</h2>
              <p className="mt-5 max-w-md leading-7 text-owner-foreground/70">No valuable job gets silently lost. From the first description to a confirmed arrival, every step stays clear.</p>
              <p className="mt-12 border-l-2 border-primary pl-4 text-sm font-semibold text-owner-foreground/85">Measured. Checked. Clearly explained.</p>
            </div>
            <div className="border-y border-owner-foreground/20 lg:mt-10">
              {process.map(({ icon: Icon, title, text }, index) => (
                <div key={title} className="grid gap-5 border-b border-owner-foreground/20 py-8 last:border-0 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center">
                  <span className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground"><Icon className="size-5" /></span>
                  <div><h3 className="text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-owner-foreground/70">{text}</p></div>
                  <span className="font-display text-3xl font-bold text-owner-foreground/25">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </CustomerShell>
  );
}

function Trust({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <article className="flex min-w-0 items-center gap-4 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">{icon}</span>
      <div className="min-w-0"><p className="truncate font-display text-xl font-bold">{value}</p><p className="text-sm text-owner-foreground/65">{label}</p></div>
    </article>
  );
}