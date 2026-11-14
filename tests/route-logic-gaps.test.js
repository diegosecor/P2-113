// Tests added after a mutation sweep: each one targets a one-line source change
// that the original eight tests let through.
import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRoute, reducePoints } from "../dist/route-logic.js";

// 0.001 degrees of latitude is about 111.19 m (pi * 6371000 / 180 * 0.001).
const STEP_METRES = 111.19;

function closeTo(actual, expected, tolerance, label) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} +/- ${tolerance}, got ${actual}`,
  );
}

function knownRoute() {
  return [
    { lat: 40, lon: -80, ele: 100, time: new Date("2026-01-01T10:00:00Z") },
    { lat: 40.001, lon: -80, ele: 130, time: new Date("2026-01-01T10:01:00Z") },
    { lat: 40.002, lon: -80, ele: 110, time: new Date("2026-01-01T10:02:00Z") },
  ];
}

test("samples evenly spaced points, rounding to the nearest index", () => {
  const points = Array.from({ length: 10 }, (_, index) => ({ id: index }));

  const ids = reducePoints(points, 5).map((point) => point.id);

  // step = 9 / 4 = 2.25 -> indices 0, 2.25, 4.5, 6.75, 9 rounded
  assert.deepStrictEqual(ids, [0, 2, 5, 7, 9]);
});

test("total distance and cumulative distance add up every segment", () => {
  const result = analyzeRoute(knownRoute());

  closeTo(result.points[1].cum, STEP_METRES, 0.05, "cum after one step");
  closeTo(result.total, 2 * STEP_METRES, 0.1, "total");
  assert.strictEqual(result.points.at(-1).cum, result.total);
});

test("speed is reported in km/h, not m/s", () => {
  const result = analyzeRoute(knownRoute());

  // 111.19 m in 60 s = 1.853 m/s = 6.67 km/h
  closeTo(result.points[1].speed, 6.67, 0.01, "speed");
});

test("grade is positive uphill and negative downhill", () => {
  const result = analyzeRoute(knownRoute());

  closeTo(result.points[1].grade, (30 / STEP_METRES) * 100, 0.05, "uphill grade");
  closeTo(result.points[2].grade, (-20 / STEP_METRES) * 100, 0.05, "downhill grade");
});

test("grade is zero when two points share a position", () => {
  const points = [
    { lat: 40, lon: -80, ele: 100, time: new Date("2026-01-01T10:00:00Z") },
    { lat: 40, lon: -80, ele: 105, time: new Date("2026-01-01T10:01:00Z") },
  ];

  const result = analyzeRoute(points);

  assert.strictEqual(result.points[1].grade, 0);
});

test("summary reports elevation range and start/end times", () => {
  const route = knownRoute();

  const result = analyzeRoute(route);

  assert.strictEqual(result.minEle, 100);
  assert.strictEqual(result.maxEle, 130);
  assert.strictEqual(result.start, route[0].time);
  assert.strictEqual(result.end, route[2].time);
});

test("smoothed speed averages over eight points on each side", () => {
  // First step takes 30 s, every later step 60 s, each step 0.001 deg north.
  const start = Date.parse("2026-01-01T10:00:00Z");
  const points = Array.from({ length: 12 }, (_, index) => ({
    lat: 40 + index * 0.001,
    lon: -80,
    ele: 100,
    time: new Date(start + (index === 0 ? 0 : 30000 + (index - 1) * 60000)),
  }));

  const result = analyzeRoute(points);

  // Window for point 0 is points 0..8: 8 steps over 30 + 7 * 60 = 450 s.
  closeTo(result.points[0].speedS, ((8 * STEP_METRES) / 450) * 3.6, 0.02, "speedS");

  // Point 0 alone could not catch a wrong look-back (its window always starts at 0).
  // Window for point 8 is points 0..11: 11 steps over 30 + 10 * 60 = 630 s.
  closeTo(result.points[8].speedS, ((11 * STEP_METRES) / 630) * 3.6, 0.02, "speedS look-back");
});
