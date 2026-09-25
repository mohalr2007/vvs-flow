export function CopperVisual() {
  return <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden" aria-label="Sculptural copper plumbing network">
    <div className="absolute inset-[10%] rounded-full bg-secondary/55 blur-3xl" />
    <svg viewBox="0 0 600 600" className="relative size-full animate-float" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="copper" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--copper-light)"/><stop offset=".45" stopColor="var(--copper)"/><stop offset="1" stopColor="var(--foreground)"/></linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="var(--foreground)" floodOpacity=".16"/></filter>
      </defs>
      <g fill="none" stroke="url(#copper)" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)">
        <path strokeWidth="42" d="M130 105v118q0 45 45 45h245q48 0 48 48v120"/>
        <path strokeWidth="34" d="M240 268v135q0 55 55 55h72"/>
        <path strokeWidth="30" d="M365 268V155q0-45 45-45h64"/>
        <path strokeWidth="26" d="M130 173h93"/>
      </g>
      <g fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" strokeDasharray="18 22" className="animate-flow">
        <path d="M130 105v118q0 45 45 45h245q48 0 48 48v120"/>
        <path d="M240 268v135q0 55 55 55h72"/>
      </g>
      <g fill="var(--copper-light)" stroke="var(--background)" strokeWidth="6"><circle cx="130" cy="105" r="28"/><circle cx="468" cy="436" r="28"/><circle cx="367" cy="458" r="25"/><circle cx="474" cy="110" r="25"/></g>
    </svg>
  </div>;
}
