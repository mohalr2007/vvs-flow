import { Check, AlertTriangle, Clock3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral"|"success"|"warning"|"danger"|"info" }) {
  const tones = { neutral: "bg-muted text-muted-foreground", success: "bg-success/12 text-success", warning: "bg-warning/20 text-warning-foreground", danger: "bg-destructive/10 text-destructive", info: "bg-accent text-accent-foreground" };
  return <span className={cn("inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}
export function MetricCard({ label, value, note, icon }: { label: string; value: string; note: string; icon?: React.ReactNode }) {
  return <Card className="figma-glass p-6 shadow-none"><div className="flex items-start justify-between gap-4"><div><p className="figma-label text-[10px] text-muted-foreground">{label}</p><p className="mt-3 font-display text-4xl font-light">{value}</p></div>{icon && <span className="text-primary">{icon}</span>}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note}</p></Card>;
}
export function AIConfidenceBadge({ value }: { value: number }) {
  const tone = value >= 80 ? "success" : value >= 60 ? "warning" : "danger";
  return <div className="flex items-center gap-2"><Sparkles className="size-4 text-primary"/><span className="text-sm text-muted-foreground">AI confidence</span><StatusBadge tone={tone}>{value}%</StatusBadge></div>;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-56 place-items-center rounded-md border border-dashed bg-card/50 p-8 text-center"><div><div className="mx-auto mb-4 grid size-11 place-items-center rounded-full bg-muted"><Clock3 className="size-5 text-muted-foreground"/></div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>;
}
export function ProgressStepper({ steps, current }: { steps: string[]; current: number }) {
  return <div aria-label="Booking progress" className="mx-auto flex w-full max-w-2xl items-start">{steps.map((step, i) => <div key={step} className="flex min-w-0 flex-1 flex-col items-center"><div className="flex w-full items-center"><div aria-hidden className={cn("h-0.5 flex-1 rounded-full transition-colors", i === 0 && "invisible", i > 0 && i <= current ? "bg-success" : "bg-border")}/><div className={cn("z-10 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all", i < current && "border-success bg-success text-success-foreground", i === current && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15", i > current && "bg-background text-muted-foreground")}>{i < current ? <Check className="size-3.5"/> : i + 1}</div><div aria-hidden className={cn("h-0.5 flex-1 rounded-full transition-colors", i === steps.length - 1 && "invisible", i < current ? "bg-success" : "bg-border")}/></div><span className={cn("mt-2 hidden text-xs sm:block", i === current ? "font-semibold text-foreground" : "text-muted-foreground")}>{step}</span></div>)}</div>;
}
export function ErrorState({ message = "Your booking hasn't been confirmed. Please try again." }: { message?: string }) { return <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/5 p-5"><div className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="size-5"/>Something went wrong</div><p className="mt-2 text-sm text-muted-foreground">{message}</p></div>; }
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) { return <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4"><div className="min-w-0">{eyebrow && <p className="figma-label mb-2 text-[10px] text-primary">{eyebrow}</p>}<h1 className="font-display text-3xl font-light sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div>{action}</header>; }
