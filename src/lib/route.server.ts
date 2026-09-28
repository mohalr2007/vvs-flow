// Route Intelligence: turns free calendar gaps into slots Mats can actually reach.
// Estimated drive times come from OSRM (no live traffic data).
import { findSlots, routeFeasibility, routeScore, type Slot } from "./scheduling";
import { stockholmParts, stockholmDate, sameStockholmDay } from "./time";
import { osrmMatrix, SERVICE_AREA } from "./location.server";

type Pt = { lat: number; lng: number };
export type RouteJob = { id: string; scheduled_at: string | null; duration_min: number; zone: string; status: string; lat: number | null; lng: number | null };
export type RouteSettings = {
  work_start_hour: number; work_end_hour: number; rest_days: number[]; route_buffer_min: number;
  day_start_mode: string; day_end_mode: string;
  home_lat: number | null; home_lng: number | null; custom_lat: number | null; custom_lng: number | null;
};

const INACTIVE = new Set(["cancelled", "expired", "completed", "needs_assessment", "waitlisted"]);
// Jobs saved before locations were captured have no coordinates: use a conservative estimate.
const UNKNOWN_LOCATION_MIN = 30;

function place(mode: string, s: RouteSettings): Pt | null {
  if (mode === "home" && s.home_lat != null && s.home_lng != null) return { lat: s.home_lat, lng: s.home_lng };
  if (mode === "custom" && s.custom_lat != null && s.custom_lng != null) return { lat: s.custom_lat, lng: s.custom_lng };
  if (mode === "none") return null;
  return { lat: SERVICE_AREA.lat, lng: SERVICE_AREA.lng };
}

export type RouteResult = { groups: { day: string; slots: Slot[] }[]; feasible: Set<string>; routeUnavailable: boolean };

export async function routeSlots(opts: { jobs: RouteJob[]; settings: RouteSettings; now: Date; duration: number; zone: string; customer: Pt; show?: number }): Promise<RouteResult> {
  const { settings: s, now, duration, customer, show = 5 } = opts;
  const active = opts.jobs.filter((j) => j.scheduled_at && !INACTIVE.has(j.status));
  // Overlap-only candidates; travel is checked precisely below.
  const candidates = findSlots({ jobs: active, now, duration, zone: opts.zone, startHour: s.work_start_hour, endHour: s.work_end_hour, restDays: s.rest_days, travelBufferMin: 0 });
  const startPt = place(s.day_start_mode, s)!;
  const endPt = place(s.day_end_mode, s);

  // Point indices: 0 = customer, 1 = day start, 2 = day end (optional), then jobs with coordinates.
  const points: Pt[] = [customer, startPt];
  const endIdx = endPt ? points.push(endPt) - 1 : -1;
  const jobIdx = new Map<string, number>();
  for (const j of active) if (j.lat != null && j.lng != null) jobIdx.set(j.id, points.push({ lat: j.lat, lng: j.lng }) - 1);

  const m = await osrmMatrix(points);
  if (!m) return { groups: [], feasible: new Set(), routeUnavailable: true };
  const to = (from: number) => m[from]?.[0] ?? null;
  const from = (dest: number) => m[0]?.[dest] ?? null;
  const jobIn = (j: RouteJob) => (jobIdx.has(j.id) ? to(jobIdx.get(j.id)!) : UNKNOWN_LOCATION_MIN);
  const jobOut = (j: RouteJob) => (jobIdx.has(j.id) ? from(jobIdx.get(j.id)!) : UNKNOWN_LOCATION_MIN);

  const today = stockholmParts(now);
  const todayUtc = Date.UTC(today.y, today.m, today.d);
  const scored: { slot: Slot; score: number; day: string }[] = [];
  const feasible = new Set<string>();

  for (const g of candidates) {
    for (const c of g.slots) {
      const start = new Date(c.start).getTime(), end = start + duration * 60000;
      const p = stockholmParts(new Date(c.start));
      const dayIndex = Math.round((Date.UTC(p.y, p.m, p.d) - todayUtc) / 86400000);
      const dayJobs = active.filter((j) => sameStockholmDay(new Date(j.scheduled_at!), new Date(c.start)))
        .map((j) => ({ j, s: new Date(j.scheduled_at!).getTime(), e: new Date(j.scheduled_at!).getTime() + j.duration_min * 60000 }))
        .sort((a, b) => a.s - b.s);
      const prev = [...dayJobs].reverse().find((x) => x.e <= start);
      const next = dayJobs.find((x) => x.s >= end);
      const workStart = stockholmDate(p.y, p.m, p.d, s.work_start_hour, 0).getTime();
      const workEnd = stockholmDate(p.y, p.m, p.d, s.work_end_hour, 0).getTime();

      const travelIn = prev ? jobIn(prev.j) : to(1);
      const prevEnd = prev ? prev.e : workStart;
      const travelOut = next ? jobOut(next.j) : endIdx >= 0 ? from(endIdx) : null;
      const nextStart = next ? next.s : endIdx >= 0 ? workEnd : null;
      // The drive from the day-start location has no buffer requirement beyond the configured one.
      const f = routeFeasibility({ start, end, prevEnd, travelIn, nextStart, travelOut, bufferMin: s.route_buffer_min });
      if (!f.ok) continue;
      feasible.add(c.start);
      const reason = prev ? `${travelIn} min drive from previous job` : next ? "Fits before next appointment" : `Estimated drive: ${travelIn} min`;
      scored.push({
        day: g.day,
        slot: { start: c.start, travel: reason, reason },
        score: routeScore({ travelIn: travelIn ?? 0, travelOut: next ? travelOut ?? 0 : 0, slackBefore: f.slackBefore, slackAfter: f.slackAfter, prevIsJob: !!prev, nextIsJob: !!next, dayIndex }),
      });
    }
  }

  // Keep the best few, spread over different hours, then show them in time order.
  scored.sort((a, b) => a.score - b.score);
  const picked: typeof scored = [];
  for (const x of scored) {
    if (picked.length >= show) break;
    if (picked.some((p) => Math.abs(new Date(p.slot.start).getTime() - new Date(x.slot.start).getTime()) < 90 * 60000)) continue;
    picked.push(x);
  }
  if (picked[0]) { picked[0].slot.recommended = true; picked[0].slot.reason = "Best fit with Mats's route"; picked[0].slot.travel = picked[0].slot.reason; }
  picked.sort((a, b) => a.slot.start.localeCompare(b.slot.start));
  const groups: RouteResult["groups"] = [];
  for (const x of picked) {
    const key = new Date(x.slot.start).toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
    const g = groups.find((gr) => new Date(gr.day).toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" }) === key);
    if (g) g.slots.push(x.slot); else groups.push({ day: x.slot.start, slots: [x.slot] });
  }
  return { groups, feasible, routeUnavailable: false };
}
