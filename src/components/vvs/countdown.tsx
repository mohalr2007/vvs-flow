import { useEffect, useRef, useState } from "react";

export function Countdown({ seconds = 900, total = 900, onComplete, ring = false }: { seconds?: number; total?: number; onComplete?: () => void; ring?: boolean }) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(false);
  useEffect(() => { setLeft(seconds); done.current = false; }, [seconds]);
  useEffect(() => {
    if (left <= 0) { if (!done.current) { done.current = true; onComplete?.(); } return; }
    const id = window.setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [left, onComplete]);
  const min = Math.floor(left / 60).toString().padStart(2, "0"), sec = (left % 60).toString().padStart(2, "0");
  const label = <time aria-live="polite" className={ring ? "font-mono text-xl font-bold text-primary" : "font-mono text-4xl font-bold text-primary"}>{min}:{sec}</time>;
  if (!ring) return label;
  const r = 34, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(1, left / total));
  return <div className="relative inline-grid size-24 place-items-center"><svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80" aria-hidden><circle cx="40" cy="40" r={r} className="fill-none stroke-muted" strokeWidth="6"/><circle cx="40" cy="40" r={r} className="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)}/></svg>{label}</div>;
}
