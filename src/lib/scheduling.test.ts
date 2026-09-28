import { describe, it, expect } from "vitest";
import { routeFeasibility } from "./scheduling";

const t = (h: number, m = 0) => Date.UTC(2026, 8, 29, h, m);
const base = { prevEnd: null, travelIn: null, nextStart: null, travelOut: null, bufferMin: 10 };

describe("routeFeasibility (prevEnd + travel + buffer <= start, end + travel + buffer <= nextStart)", () => {
  it("A: job ends 11:00, 10 min drive + 10 buffer -> 11:20 feasible", () => {
    expect(routeFeasibility({ ...base, start: t(11, 20), end: t(12, 20), prevEnd: t(11), travelIn: 10 }).ok).toBe(true);
  });
  it("A2: job ends 11:00, 15 min drive + 10 buffer -> 11:20 too early, 11:25 feasible", () => {
    expect(routeFeasibility({ ...base, start: t(11, 20), end: t(12, 20), prevEnd: t(11), travelIn: 15 }).ok).toBe(false);
    expect(routeFeasibility({ ...base, start: t(11, 25), end: t(12, 25), prevEnd: t(11), travelIn: 15 }).ok).toBe(true);
  });
  it("B: job ends 11:00, 30 min drive + 10 buffer -> 11:20 impossible", () => {
    const r = routeFeasibility({ ...base, start: t(11, 20), end: t(12, 20), prevEnd: t(11), travelIn: 30 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("previous");
  });
  it("C: ends 14:00, next job 14:30, 25 min drive + 10 buffer -> impossible", () => {
    const r = routeFeasibility({ ...base, start: t(13), end: t(14), nextStart: t(14, 30), travelOut: 25 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("next");
  });
  it("C2: ends 14:00, next job 14:30, 20 min drive + 10 buffer -> exactly fits", () => {
    expect(routeFeasibility({ ...base, start: t(13), end: t(14), nextStart: t(14, 30), travelOut: 20 }).ok).toBe(true);
  });
  it("route unavailable is never feasible", () => {
    expect(routeFeasibility({ ...base, start: t(13), end: t(14), prevEnd: t(9) }).reason).toBe("route_unavailable");
  });
});
