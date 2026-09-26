import { Link } from "@tanstack/react-router";
import { Droplets } from "lucide-react";

export function Brand({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return <Link to="/" className={`inline-flex items-center gap-2.5 font-bold ${inverted ? "text-owner-foreground" : "text-foreground"}`} aria-label="VVS Flow home">
    <span className={`grid size-9 place-items-center rounded-md ${inverted ? "bg-primary text-primary-foreground" : "bg-owner text-owner-foreground"}`}><Droplets className="size-5" /></span>
    {!compact && <span className="font-display text-lg">Ekström <span className={inverted ? "text-owner-foreground/55" : "text-muted-foreground"}>VVS</span></span>}
  </Link>;
}
