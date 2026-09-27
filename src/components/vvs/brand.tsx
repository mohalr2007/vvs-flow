import { Link } from "@tanstack/react-router";

export function Brand({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return <Link to="/" className={`group inline-flex items-center gap-2.5 ${inverted ? "text-owner-foreground" : "text-foreground"}`} aria-label="VVS Flow home">
    <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 font-display text-sm font-semibold text-primary-foreground shadow-[0_0_16px_color-mix(in_oklab,var(--primary)_35%,transparent)] transition-transform group-hover:scale-105">E</span>
    {!compact && <><span className="font-display text-lg font-normal">Ekström</span><span className="figma-label text-[10px] text-primary">VVS</span></>}
  </Link>;
}
