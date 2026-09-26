// Europe/Stockholm time helpers — client and server safe.
const TZ = "Europe/Stockholm";

export function tzOffsetMin(date: Date) {
  const local = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  return (local.getTime() - utc.getTime()) / 60000;
}

export function stockholmParts(date: Date) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value);
  return { y: get("year"), m: get("month") - 1, d: get("day"), h: get("hour"), mi: get("minute") };
}

export function stockholmDate(y: number, m: number, d: number, h: number, mi: number) {
  const guess = Date.UTC(y, m, d, h, mi);
  return new Date(guess - tzOffsetMin(new Date(guess)) * 60000);
}

export function startOfStockholmDay(date: Date, addDays = 0) {
  const p = stockholmParts(date);
  return stockholmDate(p.y, p.m, p.d + addDays, 0, 0);
}

export const fmtTime = (iso: string | Date) => new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const fmtDay = (iso: string | Date) => new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
export const fmtShortDay = (iso: string | Date) => new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric" });
export const fmtRange = (iso: string, minutes: number) => `${fmtTime(iso)}–${fmtTime(new Date(new Date(iso).getTime() + minutes * 60000))}`;
export const sameStockholmDay = (a: Date, b: Date) => { const x = stockholmParts(a), y = stockholmParts(b); return x.y === y.y && x.m === y.m && x.d === y.d; };
export const sek = (n: number) => `${n.toLocaleString("sv-SE")} SEK`;
export const zoneFromAddress = (address: string) => address.replace(/\s/g, "").match(/\b?(7\d{2})\d{2}/)?.[1] ?? "722";
