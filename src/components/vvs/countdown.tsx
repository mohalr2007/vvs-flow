import { useEffect, useState } from "react";
export function Countdown({ seconds = 872, onComplete }: { seconds?: number; onComplete?: () => void }) {
  const [left,setLeft]=useState(seconds);
  useEffect(()=>{ if(left<=0){onComplete?.();return;} const id=window.setInterval(()=>setLeft(v=>Math.max(0,v-1)),1000); return()=>window.clearInterval(id);},[left,onComplete]);
  const min=Math.floor(left/60).toString().padStart(2,"0"), sec=(left%60).toString().padStart(2,"0");
  return <time aria-live="polite" className="font-mono text-4xl font-bold text-primary">{min}:{sec}</time>;
}
