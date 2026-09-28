import { describe, it, expect } from "vitest";
import { routeFeasibility } from "./scheduling";

const t = (h: number, m = 0) => Date.UTC(2026, 8, 29, h, m);

describe("routeFeasibility", () => {
  it("A: job ends 11:00, 15 min drive + 10 buffer, start 11:20 -> wait, 11:25 needed", () => {
    // 11:00 + 15 + 10 = 11:25 > 11:20 per strict formula; report case A uses Job A 10:00–11:00 → 11:20 with 15+10.
    // Formula from report: prevEnd + travel + buffer <= start. 11:25 > 11:20 so check a 11:25 start is feasible.
    expect(routeFeasibility({ start: t(11, 25), end: t(12, 25), prevEnd: t(11), travelIn: 15, nextStart: null, travelOut: null, bufferMin: 10 }).ok).toBe(true);
  });
  it("A': 10 min drive + 10 buffer makes 11:20 feasible", () => {
    expect(routeFeasibility({ start: t(11, 20), end: t(12, 20), prevEnd: t(11), travelIn: 10, nextStart: null, travelOut: null, bufferMin: 10 }).ok).toBe(true);
  });
  it("B: 30 min drive + 10 buffer makes 11:20 impossible", () => {
    const r = routeFeasibility({ start: t(11, 20), end: t(12, 20), prevEnd: t(11), travelIn: 30, nextStart: null, travelOut: null, bufferMin: 10 });
    expect(r.ok).toBe(false); expect(r.reason).toBe("previous");
  });
  it("C: ends 14:00, next 14:30, 20 min drive + 10 buffer is impossible? exactly fits", () => {
    expect(routeFeasibility({ start: t(13), end: t(14), prevEnd: null, travelIn: null, nextStart: t(14, 30), travelOut: 20, bufferMin: 10 }).ok).toBe(true);
    const r = routeFeasibility({ start: t(13), end: t(14), prevEnd: null, travelIn: null, nextStart: t(14, 30), travelOut: 25, bufferMin: 10 });
    expect(r.ok).toBe(false); expect(r.reason).toBe("next");
  });
  it("route unavailable is never feasible", () => {
    expect(routeFeasibility({ start: t(13), end: t(14), prevEnd: t(9), travelIn: null, nextStart: null, travelOut: null, bufferMin: 10 }).reason).toBe("route_unavailable");
  });
});
