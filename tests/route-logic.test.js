import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRoute, haversineDistance, reducePoints } from "../dist/route-logic.js";

test("returns 0 when comparing the same point", () => {
  const point = {
    lat: 40.4406,
    lon: -79.9959,
  };

  const distance = haversineDistance(point, point);
  assert.strictEqual(distance, 0);
});

test("returns the same distance in both directions", () => {
  const pointA = { lat: 40.4406, lon: -79.9959 };
  const pointB = { lat: 41.4993, lon: -81.6944 };

  const forward = haversineDistance(pointA, pointB);
  const backward = haversineDistance(pointB, pointA);

  assert.strictEqual(forward, backward);
});

test("calculates a reasonable distance between known coordinates", () => {
  const pittsburgh = { lat: 40.4406, lon: -79.9959 };
  const cleveland = { lat: 41.4993, lon: -81.6944 };

  const distance = haversineDistance(pittsburgh, cleveland);

  assert.ok(distance > 184000 && distance < 186000);
});

test("returns a small route without reducing it", () => {
  const points = [{ id: 0 }, { id: 1 }, { id: 2 }];

  const result = reducePoints(points, 5);

  assert.strictEqual(result, points);
});

test("reduces a large route to the requested maximum", () => {
  const points = Array.from({ length: 10 }, (_, index) => ({ id: index }));

  const result = reducePoints(points, 4);

  assert.strictEqual(result.length, 4);
});

test("preserves the first and last points", () => {
  const points = Array.from({ length: 10 }, (_, index) => ({ id: index }));

  const result = reducePoints(points, 4);

  assert.strictEqual(result[0], points[0]);
  assert.strictEqual(result.at(-1), points.at(-1));
});

test("calculates ascent and descent", () => {
  const points = [
    { lat: 40, lon: -80, ele: 100, time: new Date("2026-01-01T10:00:00Z") },
    { lat: 40.001, lon: -80, ele: 130, time: new Date("2026-01-01T10:01:00Z") },
    { lat: 40.002, lon: -80, ele: 110, time: new Date("2026-01-01T10:02:00Z") },
  ];

  const result = analyzeRoute(points);

  assert.strictEqual(result.up, 30);
  assert.strictEqual(result.down, 20);
});

test("handles equal timestamps without producing Infinity", () => {
  const sameTime = new Date("2026-01-01T10:00:00Z");
  const points = [
    { lat: 40, lon: -80, ele: 100, time: sameTime },
    { lat: 40.001, lon: -80, ele: 100, time: sameTime },
  ];

  const result = analyzeRoute(points);

  assert.ok(Number.isFinite(result.points[1].speed));
  assert.ok(Number.isFinite(result.points[1].speedS));
  assert.strictEqual(result.points[1].speed, 0);
});