// Pure, deterministic scheduling + waitlist scoring rules (client and server safe).
import { stockholmDate, stockholmParts } from "./time";

export type BusyJob = { scheduled_at: string | null; duration_min: number; zone: string; status: string };
export type Slot = { start: string; travel: string };

const INACTIVE = new Set(["cancelled", "expired", "completed", "needs_assessment", "new", "qualified", "waitlisted"]);
export const TRAVEL_BUFFER_MIN = 20;

export function findSlots(opts: { jobs: BusyJob[]; now: Date; duration: number; zone: string; startHour: number; endHour: number; days?: number; perDay?: number }) {
  const { jobs, now, duration, zone, startHour, endHour, days = 4, perDay = 4 } = opts;
  const busy = jobs.filter((j) => j.scheduled_at && !INACTIVE.has(j.status)).map((j) => ({ s: new Date(j.scheduled_at!).getTime(), e: new Date(j.scheduled_at!).getTime() + j.duration_min * 60000, zone: j.zone }));
  const out: { day: string; slots: Slot[] }[] = [];
  const base = stockholmParts(now);
  for (let i = 0; i < days + 4 && out.length < 3; i++) {
    const slots: Slot[] = [];
    const wd = new Date(Date.UTC(base.y, base.m, base.d + i)).getUTCDay();
    if (wd === 0 || wd === 6) { continue; }
    for (let t = startHour * 60; t + duration <= endHour * 60 && slots.length < perDay; t += 30) {
      const start = stockholmDate(base.y, base.m, base.d + i, Math.floor(t / 60), t % 60);
      const s = start.getTime(), e = s + duration * 60000;
      if (s < now.getTime() + 60 * 60000) continue;
      const clash = busy.some((b) => { const buf = b.zone === zone ? 0 : TRAVEL_BUFFER_MIN * 60000; return s < b.e + buf && e + buf > b.s; });
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
