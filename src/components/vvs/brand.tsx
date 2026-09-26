import { Link } from "@tanstack/react-router";
import { Droplets } from "lucide-react";

export function Brand({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return <Link to="/" className={`inline-flex items-center gap-2.5 font-bold ${inverted ? "text-owner-foreground" : "text-foreground"}`} aria-label="VVS Flow home">
    <span className={`grid size-9 place-items-center rounded-md ${inverted ? "bg-owner-foreground text-owner" : "bg-primary text-primary-foreground button-shadow"}`}><Droplets className="size-5" /></span>
    {!compact && <span className="font-display text-lg">VVS Flow</span>}
  </Link>;
}
