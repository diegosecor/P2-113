// Geospatial distance in metres between two GPX coordinates.
export function haversineDistance(a, b) {
  const earthRadius = 6000000;
  const latitudeDelta = ((b.lat - a.lat) * Math.PI) / 180;
  const longitudeDelta = ((b.lon - a.lon) * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

// Keep evenly spaced display samples so very long activities stay responsive in Canvas.
export function reducePoints(points, max = 600) {
  if (points.length <= max) return points;

  const step = (points.length - 1) / (max - 1);
  const sample = [];
  for (let index = 0; index < max; index += 1) {
    sample.push(points[Math.round(index * step)]);
  }
  return sample;
}

// Calculate distance, elevation change, smoothed speed, grade, and events.
export function analyzeRoute(points) {
  let cumulativeDistance = 0;
  let ascent = 0;
  let descent = 0;

  points.forEach((point, index) => {
    if (index === 0) {
      point.cum = 0;
      point.speed = 0;
      point.grade = 0;
      return;
    }

    const previous = points[index - 1];
    const distance = haversineDistance(previous, point);
    const duration = (point.time - previous.time) / 1000;
    const elevationChange = point.ele - previous.ele;

    cumulativeDistance += distance;
    ascent += Math.max(0, elevationChange);
    descent += Math.max(0, -elevationChange);
    point.cum = cumulativeDistance;
    point.speed = duration > 0 ? (distance / duration) * 3.6 : 0;
    point.grade = distance > 0 ? (elevationChange / distance) * 100 : 0;
  });

  const smoothedPoints = points.map((point, index) => {
    const startIndex = Math.max(0, index - 8);
    const endIndex = Math.min(points.length - 1, index + 8);
    const distance = points[endIndex].cum - points[startIndex].cum;
    const duration =
      (points[endIndex].time - points[startIndex].time) / 1000;
    const elevationChange = points[endIndex].ele - points[startIndex].ele;

    return {
      ...point,
      speedS: duration > 0 ? (distance / duration) * 3.6 : 0,
      gradeS: distance > 0 ? (elevationChange / distance) * 100 : 0,
    };
  });

  const fastest = smoothedPoints.reduce((current, point) =>
    point.speedS > current.speedS ? point : current,
  );
  const movingPoints = smoothedPoints.filter((point) => point.speedS > 0.08);
  const slowest = (
    movingPoints.length ? movingPoints : smoothedPoints
  ).reduce((current, point) =>
    point.speedS < current.speedS ? point : current,
  );
  const steepestClimb = smoothedPoints.reduce((current, point) =>
    point.gradeS > current.gradeS ? point : current,
  );
  const steepestDescent = smoothedPoints.reduce((current, point) =>
    point.gradeS < current.gradeS ? point : current,
  );
  const minSpeed = slowest.speedS;
  const maxSpeed = fastest.speedS;

  return {
    points: smoothedPoints,
    total: cumulativeDistance,
    up: ascent,
    down: descent,
    minEle: Math.min(...points.map((point) => point.ele)),
    maxEle: Math.max(...points.map((point) => point.ele)),
    start: points[0].time,
    end: points.at(-1).time,
    minSpeed,
    maxSpeed,
    events: [
      {
        p: fastest,
        label: "Fastest section",
        detail: `${fastest.speedS.toFixed(1)} km/h`,
      },
      {
        p: slowest,
        label: "Slowest section",
        detail: `${slowest.speedS.toFixed(1)} km/h`,
      },
      {
        p: steepestClimb,
        label: "Steepest climb",
        detail: `${steepestClimb.gradeS.toFixed(1)}% grade`,
      },
      {
        p: steepestDescent,
        label: "Steepest descent",
        detail: `${steepestDescent.gradeS.toFixed(1)}% grade`,
      },
    ],
  };
}
