// Pure, deterministic scheduling + waitlist scoring rules (client and server safe).
import { stockholmDate, stockholmParts } from "./time";

export type BusyJob = { scheduled_at: string | null; duration_min: number; zone: string; status: string };
export type Slot = { start: string; travel: string; reason?: string; recommended?: boolean };

// Any scheduled job blocks its time, whatever its stage — only dead statuses free the slot.
const INACTIVE = new Set(["cancelled", "expired", "completed", "needs_assessment", "waitlisted"]);
export const TRAVEL_BUFFER_MIN = 20;

export function findSlots(opts: { jobs: BusyJob[]; now: Date; duration: number; zone: string; startHour: number; endHour: number; days?: number; perDay?: number; restDays?: number[]; travelBufferMin?: number }) {
  const { jobs, now, duration, zone, startHour, endHour, days = 4, perDay = 48, restDays = [0, 6], travelBufferMin = TRAVEL_BUFFER_MIN } = opts;
  const busy = jobs.filter((j) => j.scheduled_at && !INACTIVE.has(j.status)).map((j) => ({ s: new Date(j.scheduled_at!).getTime(), e: new Date(j.scheduled_at!).getTime() + j.duration_min * 60000, zone: j.zone }));
  const out: { day: string; slots: Slot[] }[] = [];
  const base = stockholmParts(now);
  for (let i = 0; i < days + 8 && out.length < 3; i++) {
    const slots: Slot[] = [];
    const wd = new Date(Date.UTC(base.y, base.m, base.d + i)).getUTCDay();
    if (restDays.includes(wd)) { continue; }
    for (let t = startHour * 60; t + duration <= endHour * 60 && slots.length < perDay; t += 30) {
      const start = stockholmDate(base.y, base.m, base.d + i, Math.floor(t / 60), t % 60);
      const s = start.getTime(), e = s + duration * 60000;
      if (s < now.getTime() + 60 * 60000) continue;
      const clash = busy.some((b) => { const buf = b.zone === zone ? 0 : travelBufferMin * 60000; return s < b.e + buf && e + buf > b.s; });
      if (clash) continue;
      const near = busy.find((b) => b.zone === zone && Math.abs(b.e - s) < 3 * 3600000);
      slots.push({ start: start.toISOString(), travel: near ? `On route · Zone ${zone}` : `~${TRAVEL_BUFFER_MIN} min travel` });
    }
    if (slots.length) out.push({ day: slots[0]!.start, slots });
  }
  return out;
}

export type ScoreInput = { zone: string; duration_min: number; flexibility: string; urgency: string; created_at: string };
export type Breakdown = { label: string; points: number }[];

export function scoreMatch(entry: ScoreInput, slot: { zone: string; duration_min: number }, now: Date) {
  const zd = Math.abs(Number(entry.zone) - Number(slot.zone));
  const zone = entry.zone === slot.zone ? { label: "Same zone", points: 40 } : zd <= 1 ? { label: "Nearby zone", points: 28 } : zd <= 3 ? { label: "Travel fit", points: 15 } : { label: "Far zone", points: 0 };
  const fits = entry.duration_min <= slot.duration_min;
  const flex = /flex/i.test(entry.flexibility) ? 15 : /fixed/i.test(entry.flexibility) ? 5 : 10;
  const days = Math.floor((now.getTime() - new Date(entry.created_at).getTime()) / 86400000);
  const waiting = Math.min(5, Math.max(0, days));
  const urgency = entry.urgency === "High" || entry.urgency === "Emergency" ? 2 : entry.urgency === "Normal" ? 1 : 0;
  const breakdown: Breakdown = [zone, { label: fits ? "Duration fits" : "Too long for slot", points: fits ? 30 : 0 }, { label: "Flexibility", points: flex }, { label: "Waiting duration", points: waiting }, { label: "Urgency", points: urgency }];
  return { score: breakdown.reduce((a, b) => a + b.points, 0), breakdown, eligible: fits };
}

// ---- Route-aware feasibility (pure) ----
// A slot is feasible only if:
//   prevEnd + travelIn + buffer <= start   AND   end + travelOut + buffer <= nextStart
// travelIn/travelOut are minutes; null means no route could be computed -> never feasible.
export type Feasibility = { ok: boolean; reason: "ok" | "route_unavailable" | "previous" | "next"; slackBefore: number; slackAfter: number };

export function routeFeasibility(o: { start: number; end: number; prevEnd: number | null; travelIn: number | null; nextStart: number | null; travelOut: number | null; bufferMin: number }): Feasibility {
  const MIN = 60000;
  let slackBefore = 0, slackAfter = 0;
  if (o.prevEnd != null) {
    if (o.travelIn == null) return { ok: false, reason: "route_unavailable", slackBefore, slackAfter };
    slackBefore = (o.start - (o.prevEnd + (o.travelIn + o.bufferMin) * MIN)) / MIN;
    if (slackBefore < 0) return { ok: false, reason: "previous", slackBefore, slackAfter };
  }
  if (o.nextStart != null) {
    if (o.travelOut == null) return { ok: false, reason: "route_unavailable", slackBefore, slackAfter };
    slackAfter = (o.nextStart - (o.end + (o.travelOut + o.bufferMin) * MIN)) / MIN;
    if (slackAfter < 0) return { ok: false, reason: "next", slackBefore, slackAfter };
  }
  return { ok: true, reason: "ok", slackBefore, slackAfter };
}

// Lower is better: little driving, little idle time around the slot, sooner days preferred.
export function routeScore(o: { travelIn: number; travelOut: number; slackBefore: number; slackAfter: number; prevIsJob: boolean; nextIsJob: boolean; dayIndex: number }) {
  const idle = (o.prevIsJob ? Math.min(o.slackBefore, 240) : 0) + (o.nextIsJob ? Math.min(o.slackAfter, 240) : 0);
  return o.travelIn + o.travelOut + idle / 4 + o.dayIndex * 25;
}
