/* =============================================================================
   APPLICATION CODE MAP
   -----------------------------------------------------------------------------
   1. Shared state and demo data.
   2. Route analysis: distance, speed, grade, elevation, and events.
   3. Canvas rendering: contours, circles, route halo, and elevation chart.
   4. Import and local storage: browser-only GPX processing and saved routes.
   5. View interaction: map bounds, zoom, drag, reset, playback, and opacity.
   ============================================================================= */
      // Shared DOM helpers and the two canvas contexts used by the interface.
      const $ = (s) => document.querySelector(s),
        canvas = $("#canvas"),
        ctx = canvas.getContext("2d"),
        elevationCanvas = $("#elevationChart"),
        elevationCtx = elevationCanvas.getContext("2d"),
        speedCanvas = $("#speedChart"),
        speedCtx = speedCanvas.getContext("2d");
      // A deployed frontend reads its API address from config.js; localhost keeps the convenient relative API.
      const apiBase = (window.PATH_FREQUENCY_API_BASE || "").replace(/\/$/, "");
      const apiFetch = (endpoint, options) => {
        const runningLocally = ["localhost", "127.0.0.1"].includes(location.hostname);
        if (!apiBase && !runningLocally) return Promise.reject(new Error("Backend URL is not configured"));
        return fetch(`${apiBase}${endpoint}`, options);
      };
      let mode = "speed",
        progress = 0,
        playing = false,
        last = 0,
        zoom = 1,
        pan = { x: 0, y: 0 },
        drag = null,
        data = makeDemo(),
        analysis = analyze(data);
      // Default GPX-like records keep the app understandable and usable before the first import.
      function makeDemo() {
        return [
          [4.67531, -75.42537, 3773.2, "2026-07-18T10:51:32Z"],
          [4.67671, -75.42348, 3815.4, "2026-07-18T10:59:15Z"],
          [4.67802, -75.42283, 3878.2, "2026-07-18T11:08:36Z"],
          [4.67948, -75.42383, 3961.3, "2026-07-18T11:24:27Z"],
          [4.68173, -75.42428, 4043.7, "2026-07-18T11:39:26Z"],
          [4.68247, -75.42298, 4121.5, "2026-07-18T11:55:16Z"],
          [4.68253, -75.42019, 4127.2, "2026-07-18T12:04:17Z"],
          [4.68494, -75.4194, 4098.0, "2026-07-18T12:11:30Z"],
          [4.68791, -75.41934, 4088.5, "2026-07-18T12:16:54Z"],
          [4.69076, -75.41912, 4094.2, "2026-07-18T12:22:33Z"],
          [4.6925, -75.41725, 4096.2, "2026-07-18T12:34:06Z"],
          [4.69111, -75.41487, 4104.4, "2026-07-18T12:39:30Z"],
          [4.69174, -75.41334, 4116.9, "2026-07-18T12:48:07Z"],
          [4.6939, -75.41151, 4105.2, "2026-07-18T12:53:21Z"],
          [4.69565, -75.40911, 4088.8, "2026-07-18T12:58:53Z"],
          [4.69737, -75.40693, 4106.1, "2026-07-18T13:16:18Z"],
          [4.69939, -75.40495, 4144.3, "2026-07-18T13:22:45Z"],
          [4.7017, -75.40292, 4165.1, "2026-07-18T13:29:12Z"],
          [4.70271, -75.40033, 4165.6, "2026-07-18T13:35:49Z"],
          [4.70339, -75.39767, 4163.4, "2026-07-18T13:44:56Z"],
          [4.70424, -75.39559, 4182.9, "2026-07-18T13:53:34Z"],
          [4.70644, -75.39516, 4223.3, "2026-07-18T14:02:55Z"],
          [4.70855, -75.39401, 4267.5, "2026-07-18T14:09:58Z"],
          [4.71062, -75.3936, 4329.7, "2026-07-18T14:19:29Z"],
          [4.71284, -75.39365, 4429.9, "2026-07-18T14:37:24Z"],
          [4.71474, -75.39485, 4506.3, "2026-07-18T14:50:22Z"],
          [4.71595, -75.39348, 4587.1, "2026-07-18T15:03:45Z"],
          [4.71575, -75.39164, 4605.7, "2026-07-18T15:19:49Z"],
          [4.71585, -75.39418, 4570.7, "2026-07-18T15:25:37Z"],
          [4.71386, -75.39445, 4474.8, "2026-07-18T15:30:18Z"],
          [4.71205, -75.39355, 4387.3, "2026-07-18T15:36:32Z"],
          [4.7096, -75.39363, 4291.2, "2026-07-18T15:42:20Z"],
          [4.70698, -75.39488, 4234.6, "2026-07-18T15:49:52Z"],
          [4.70451, -75.39543, 4188.5, "2026-07-18T15:55:24Z"],
          [4.70327, -75.39744, 4163.8, "2026-07-18T16:09:03Z"],
          [4.70276, -75.40004, 4164.1, "2026-07-18T16:12:40Z"],
          [4.70175, -75.40277, 4165.8, "2026-07-18T16:19:45Z"],
          [4.69946, -75.40489, 4143.4, "2026-07-18T16:24:09Z"],
          [4.69734, -75.40699, 4105.3, "2026-07-18T16:28:40Z"],
          [4.69555, -75.40945, 4088.4, "2026-07-18T16:40:06Z"],
          [4.69365, -75.41173, 4112.7, "2026-07-18T16:46:55Z"],
          [4.69135, -75.41376, 4116.3, "2026-07-18T16:51:39Z"],
          [4.69198, -75.41541, 4099.6, "2026-07-18T16:56:17Z"],
          [4.69228, -75.41845, 4093.7, "2026-07-18T17:00:25Z"],
          [4.68945, -75.4192, 4092.8, "2026-07-18T17:04:32Z"],
          [4.68653, -75.41959, 4089.7, "2026-07-18T17:09:13Z"],
          [4.68374, -75.41944, 4113.3, "2026-07-18T17:30:26Z"],
          [4.68274, -75.42147, 4136.1, "2026-07-18T17:36:10Z"],
          [4.68301, -75.42392, 4098.0, "2026-07-18T17:41:17Z"],
          [4.68061, -75.42457, 4011.2, "2026-07-18T17:47:41Z"],
          [4.67878, -75.42325, 3918.2, "2026-07-18T17:55:10Z"],
          [4.67713, -75.42342, 3838.8, "2026-07-18T18:02:39Z"],
          [4.67569, -75.42511, 3782.1, "2026-07-18T18:08:16Z"],
          [4.67521, -75.42538, 3747.7, "2026-07-18T18:40:50Z"],
          [4.67385, -75.42589, 3683.0, "2026-07-18T18:49:21Z"],
          [4.67155, -75.42659, 3628.9, "2026-07-18T18:55:54Z"],
          [4.66996, -75.42701, 3572.5, "2026-07-18T19:01:29Z"],
          [4.66729, -75.42802, 3569.0, "2026-07-18T19:06:14Z"],
          [4.66541, -75.429, 3506.5, "2026-07-18T19:12:51Z"],
          [4.66357, -75.43018, 3449.1, "2026-07-18T19:20:06Z"],
          [4.66289, -75.433, 3445.9, "2026-07-18T19:25:40Z"],
          [4.66288, -75.43536, 3437.7, "2026-07-18T19:30:36Z"],
          [4.66213, -75.43723, 3396.9, "2026-07-18T19:35:53Z"],
          [4.66024, -75.43805, 3354.7, "2026-07-18T19:50:41Z"],
          [4.65933, -75.43854, 3279.6, "2026-07-18T19:56:58Z"],
          [4.65763, -75.43851, 3293.4, "2026-07-18T20:03:25Z"],
          [4.65643, -75.44045, 3318.3, "2026-07-18T20:09:52Z"],
          [4.65475, -75.44168, 3242.6, "2026-07-18T20:17:01Z"],
          [4.65384, -75.44391, 3272.4, "2026-07-18T20:23:37Z"],
          [4.65313, -75.44609, 3233.5, "2026-07-18T20:28:46Z"],
          [4.65068, -75.44634, 3182.5, "2026-07-18T20:34:50Z"],
          [4.65098, -75.44853, 3157.2, "2026-07-18T20:39:14Z"],
          [4.65052, -75.45002, 3092.8, "2026-07-18T20:48:36Z"],
          [4.64913, -75.45134, 3018.1, "2026-07-18T20:54:26Z"],
          [4.64779, -75.45272, 2951.2, "2026-07-18T20:59:40Z"],
          [4.6475, -75.45408, 2878.8, "2026-07-18T21:05:33Z"],
          [4.64933, -75.45421, 2847.1, "2026-07-18T21:12:27Z"],
          [4.6475, -75.45615, 2897.9, "2026-07-18T21:22:15Z"],
          [4.64739, -75.45801, 2933.4, "2026-07-18T21:32:32Z"],
          [4.64762, -75.46069, 2923.1, "2026-07-18T21:37:46Z"],
          [4.64719, -75.46238, 2854.7, "2026-07-18T21:43:45Z"],
          [4.64639, -75.46358, 2773.2, "2026-07-18T21:53:05Z"],
          [4.64695, -75.46516, 2692.2, "2026-07-18T22:01:06Z"],
          [4.64497, -75.46592, 2626.5, "2026-07-18T22:08:35Z"],
          [4.64456, -75.46704, 2615.7, "2026-07-18T22:20:12Z"],
          [4.64449, -75.46988, 2586.3, "2026-07-18T22:26:28Z"],
          [4.64461, -75.4717, 2550.3, "2026-07-18T22:33:23Z"],
          [4.64402, -75.4745, 2518.2, "2026-07-18T22:38:52Z"],
          [4.64422, -75.4775, 2480.2, "2026-07-18T22:45:58Z"],
          [4.64352, -75.48026, 2452.7, "2026-07-18T22:52:12Z"],
          [4.64189, -75.48256, 2443.3, "2026-07-18T22:57:05Z"],
          [4.64051, -75.48317, 2428.1, "2026-07-18T23:01:45Z"],
        ].map(([lat, lon, ele, time]) => ({
          lat,
          lon,
          ele,
          time: new Date(time),
        }));
      }
      // Geospatial distance in metres between two GPX coordinates.
      function hav(a, b) {
        const R = 6371000,
          dLat = ((b.lat - a.lat) * Math.PI) / 180,
          dLon = ((b.lon - a.lon) * Math.PI) / 180,
          x =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((a.lat * Math.PI) / 180) *
              Math.cos((b.lat * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(x));
      }
      // Keep evenly spaced display samples so very long activities stay responsive in Canvas.
      function reducePoints(points, max = 600) {
        if (points.length <= max) return points;
        let step = (points.length - 1) / (max - 1),
          sample = [];
        for (let i = 0; i < max; i++) sample.push(points[Math.round(i * step)]);
        return sample;
      }
      /* =============================================================================
         ROUTE ANALYSIS
         -----------------------------------------------------------------------------
         Calculate distance, elevation change, smoothed speed, grade, and events.
         ============================================================================= */
      function analyze(points) {
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
          const distance = hav(previous, point);
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
        const movingPoints = smoothedPoints.filter(
          (point) => point.speedS > 0.08,
        );
        // A stationary or zero-duration GPX has no moving point; use all samples rather than crashing.
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
      // Format elapsed seconds for the timeline and activity summary.
      function fmtDuration(s) {
        s = Math.max(0, s);
        let h = Math.floor(s / 3600),
          m = Math.floor((s % 3600) / 60);
        return h ? `${h} h ${m} m` : `${m} min`;
      }
      // Update numeric labels after a route is analysed.
      function setStats() {
        let a = analysis;
        $("#distance").textContent = (a.total / 1000).toFixed(1) + " km";
        $("#duration").textContent = fmtDuration((a.end - a.start) / 1000);
        $("#elevation").textContent =
          Math.round(a.maxEle).toLocaleString("en-US") + " m";
        $("#descent").textContent =
          "−" + Math.round(a.down).toLocaleString("en-US") + " m";
      }
      // Map every speed to a continuous red-to-green scale, normalised by this activity's maximum speed.
      function speedScale(speed, maxSpeed, minSpeed = 0) {
        let value = Math.max(
          0,
          Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed || 1)),
        );
        return { value, hue: Math.round(4 + 136 * value) };
      }
      // Colour rule for the alternate grade view; speed view keeps a copper route core.
      function palette(v) {
        if (mode === "speed") return "#f07a2f";
        let t = Math.min(1, Math.abs(v) / 25);
        return v >= 0
          ? `rgb(${183 + Math.round(t * 56)},${83 + Math.round(t * 70)},23)`
          : `rgb(11,${100 + Math.round(t * 55)},${145 + Math.round(t * 70)})`;
      }
      // Draw the full elevation profile and mark the active position from the playback timeline.
      function drawElevationChart() {
        let w = elevationCanvas.clientWidth,
          h = elevationCanvas.clientHeight;
        if (!w || !h) return;
        let d = Math.min(1.5, devicePixelRatio),
          pts = analysis.points,
          min = analysis.minEle,
          max = analysis.maxEle,
          pad = 3;
        elevationCanvas.width = Math.round(w * d);
        elevationCanvas.height = Math.round(h * d);
        elevationCtx.setTransform(d, 0, 0, d, 0, 0);
        elevationCtx.clearRect(0, 0, w, h);
        let y = (p) =>
            h - pad - ((p.ele - min) / (max - min || 1)) * (h - pad * 2),
          x = (i) => pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
        let fill = elevationCtx.createLinearGradient(0, 0, 0, h);
        fill.addColorStop(0, "rgba(74,214,228,.48)");
        fill.addColorStop(1, "rgba(30,110,159,.04)");
        elevationCtx.beginPath();
        pts.forEach((p, i) =>
          i ? elevationCtx.lineTo(x(i), y(p)) : elevationCtx.moveTo(x(i), y(p)),
        );
        elevationCtx.lineTo(w - pad, h - pad);
        elevationCtx.lineTo(pad, h - pad);
        elevationCtx.closePath();
        elevationCtx.fillStyle = fill;
        elevationCtx.fill();
        elevationCtx.beginPath();
        pts.forEach((p, i) =>
          i ? elevationCtx.lineTo(x(i), y(p)) : elevationCtx.moveTo(x(i), y(p)),
        );
        elevationCtx.strokeStyle = "#62dfe6";
        elevationCtx.lineWidth = 1.25;
        elevationCtx.stroke();
        let current = Math.min(
          pts.length - 1,
          Math.round(progress * (pts.length - 1)),
        );
        elevationCtx.beginPath();
        elevationCtx.arc(x(current), y(pts[current]), 3, 0, Math.PI * 2);
        elevationCtx.fillStyle = "#ffe15c";
        elevationCtx.fill();
        $("#elevationRange").textContent =
          `${Math.round(min).toLocaleString("en-US")}–${Math.round(max).toLocaleString("en-US")} m`;
      }
      // Draw a matching, larger speed profile. Its red/orange/green line uses each route's own min/max speed.
      function drawSpeedChart() {
        let w = speedCanvas.clientWidth, h = speedCanvas.clientHeight;
        if (!w || !h) return;
        let d = Math.min(1.5, devicePixelRatio), pts = analysis.points, pad = 4,
          min = analysis.minSpeed, max = analysis.maxSpeed;
        speedCanvas.width = Math.round(w * d);
        speedCanvas.height = Math.round(h * d);
        speedCtx.setTransform(d, 0, 0, d, 0, 0);
        speedCtx.clearRect(0, 0, w, h);
        const x = (i) => pad + (i / Math.max(1, pts.length - 1)) * (w - pad * 2);
        const y = (p) => h - pad - ((p.speedS - min) / (max - min || 1)) * (h - pad * 2);
        speedCtx.beginPath();
        pts.forEach((p, i) => i ? speedCtx.lineTo(x(i), y(p)) : speedCtx.moveTo(x(i), y(p)));
        speedCtx.lineTo(w - pad, h - pad); speedCtx.lineTo(pad, h - pad); speedCtx.closePath();
        let fill = speedCtx.createLinearGradient(0, 0, 0, h);
        fill.addColorStop(0, "rgba(88,222,111,.38)"); fill.addColorStop(.5, "rgba(255,157,55,.18)"); fill.addColorStop(1, "rgba(239,70,70,.04)");
        speedCtx.fillStyle = fill; speedCtx.fill();
        for (let i = 1; i < pts.length; i++) {
          const tone = speedScale(pts[i].speedS, max, min);
          speedCtx.beginPath(); speedCtx.moveTo(x(i - 1), y(pts[i - 1])); speedCtx.lineTo(x(i), y(pts[i]));
          speedCtx.strokeStyle = `hsl(${tone.hue}, 88%, 58%)`; speedCtx.lineWidth = 2.25; speedCtx.stroke();
        }
        let current = Math.min(pts.length - 1, Math.round(progress * (pts.length - 1)));
        speedCtx.beginPath(); speedCtx.arc(x(current), y(pts[current]), 3.5, 0, Math.PI * 2);
        speedCtx.fillStyle = "#fff"; speedCtx.fill();
        $("#speedRange").textContent = `${min.toFixed(1)}–${max.toFixed(1)} km/h`;
      }
      // Match the canvas resolution to the visual container and the device pixel ratio.
      function resize() {
        let r = canvas.parentElement.getBoundingClientRect(),
          d = Math.min(1.5, devicePixelRatio);
        canvas.width = r.width * d;
        canvas.height = r.height * d;
        ctx.setTransform(d, 0, 0, d, 0, 0);
      }
      // Project latitude/longitude into fitted canvas coordinates; this is a visual projection, not GIS geometry.
      function positions() {
        let pts = analysis.points,
          w = canvas.clientWidth,
          h = canvas.clientHeight,
          pad = Math.min(90, w * 0.09, h * 0.09),
          lats = pts.map((p) => p.lat),
          factor = Math.cos(
            ((lats.reduce((a, b) => a + b, 0) / lats.length) * Math.PI) / 180,
          ),
          xs = pts.map((p) => p.lon * factor),
          minx = Math.min(...xs),
          maxx = Math.max(...xs),
          miny = Math.min(...lats),
          maxy = Math.max(...lats),
          scale =
            Math.min(
              (w - pad * 2) / (maxx - minx || 1),
              (h - pad * 2) / (maxy - miny || 1),
            ) * zoom,
          cx = (minx + maxx) / 2,
          cy = (miny + maxy) / 2;
        return pts.map((p, i) => ({
          x: w / 2 + pan.x + (xs[i] - cx) * scale,
          y: h / 2 + pan.y - (p.lat - cy) * scale,
          p,
        }));
      }
      /* =============================================================================
         CANVAS RENDERING
         -----------------------------------------------------------------------------
         Draw contours, circle fields, speed halo, route spine, and active marker.
         ============================================================================= */
      function draw() {
        let w = canvas.clientWidth,
          h = canvas.clientHeight;
        if (!w) return;
        ctx.clearRect(0, 0, w, h);
        let pos = positions(),
          n = pos.length,
          eMin = analysis.minEle,
          eMax = analysis.maxEle,
          maxSpeed = analysis.maxSpeed,
          minSpeed = analysis.minSpeed;
        ctx.fillStyle = "rgba(3,6,13,.42)";
        ctx.fillRect(0, 0, w, h);
        // Turquoise topographic samples sit perpendicular to the route.
        for (let i = 8; i < n - 8; i += Math.max(5, Math.floor(n / 85))) {
          let a = pos[i - 1],
            q = pos[i],
            b = pos[i + 1],
            dx = b.x - a.x,
            dy = b.y - a.y,
            len = Math.hypot(dx, dy) || 1,
            nx = -dy / len,
            ny = dx / len,
            e = (q.p.ele - eMin) / (eMax - eMin || 1);
          for (let side of [-1, 1]) {
            let off = 18 + e * 44;
            ctx.strokeStyle = "rgba(71,239,215,.88)";
            ctx.lineWidth = 1.55;
            ctx.shadowColor = "rgba(41,235,217,.7)";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(
              q.x + nx * off * side,
              q.y + ny * off * side,
              3 + e * 6,
              3 + e * 6,
              0,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
            if (i % 14 === 0) {
              ctx.strokeStyle = "rgba(162,255,235,.65)";
              ctx.lineWidth = 1.15;
              ctx.beginPath();
              ctx.moveTo(q.x, q.y);
              ctx.lineTo(q.x + nx * off * side, q.y + ny * off * side);
              ctx.stroke();
            }
          }
        }
        // Contour echoes: elevation determines separation.
        let contourStep = n > 420 ? 2 : 1;
        for (let level = 1; level <= 16; level++) {
          ctx.beginPath();
          pos.forEach((q, i) => {
            if (i % contourStep) return;
            let e = (q.p.ele - eMin) / (eMax - eMin || 1),
              dir = Math.sin(i * 0.19 + level * 0.82),
              offset = (level - 8) * (8 + e * 5);
            let x = q.x + Math.cos(i * 0.07 + level) * offset,
              y = q.y + Math.sin(i * 0.09 + level) * offset + dir * e * 10;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          });
          ctx.strokeStyle = `rgba(45,180,246,${0.3 + level * 0.028})`;
          ctx.lineWidth = level % 4 === 0 ? 2.15 : 1.25;
          ctx.shadowColor = "rgba(35,171,255,.48)";
          ctx.shadowBlur = 7;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        // Circular speed samples use the same 0-to-maximum-speed colour scale as the route halo.
        // Protect the average-speed display when a GPX has equal or invalid timestamps.
        let durationSeconds = Math.max(
            1,
            (analysis.end - analysis.start) / 1000,
          ),
          avg = (analysis.total / durationSeconds) * 3.6,
          fieldStep = Math.max(1, Math.floor(n / 64));
        for (let i = 5; i < n - 5; i += fieldStep) {
          let q = pos[i],
            tone = speedScale(q.p.speedS, maxSpeed, minSpeed),
            extreme = Math.abs(tone.value - 0.5) * 2,
            rings = extreme > 0.3 ? 3 : 1,
            r = 5 + tone.value * 15;
          for (let ring = 1; ring <= rings; ring++) {
            let alpha =
              (ring === 1 ? 0.1 : 0.14 - ring * 0.03) + extreme * 0.12;
            ctx.strokeStyle = `hsla(${tone.hue},86%,60%,${Math.max(0.05, alpha)})`;
            ctx.lineWidth = ring === 1 ? 0.8 : 1;
            ctx.beginPath();
            ctx.arc(q.x, q.y, r * ring, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        // Route geometry: dark base, proportional speed halo, then a copper core for legibility.
        ctx.beginPath();
        pos.forEach((q, i) =>
          i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y),
        );
        ctx.strokeStyle = "rgba(0,0,0,.85)";
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        let haloStep = n > 420 ? 2 : 1;
        for (let i = haloStep; i < n; i += haloStep) {
          let q = pos[i],
            p = pos[i - haloStep],
            tone = speedScale(q.p.speedS, maxSpeed, minSpeed),
            strength = 0.055 + tone.value * 0.32;
          for (let layer = 5; layer >= 1; layer--) {
            ctx.strokeStyle = `hsla(${tone.hue},88%,58%,${strength / (layer * 2.35)})`;
            ctx.lineWidth = 3 + layer * (3.5 + tone.value * 1.5);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        // High-contrast pace markers: red is the activity's slow end, orange is middle, green is fastest.
        if (mode === "speed") {
          const markerStep = Math.max(2, Math.floor(n / 95));
          for (let i = 1; i < n; i++) {
            const q = pos[i], prev = pos[i - 1], tone = speedScale(q.p.speedS, maxSpeed, minSpeed);
            ctx.strokeStyle = `hsl(${tone.hue}, 92%, 56%)`;
            ctx.lineWidth = 3.8 + tone.value * 2.2;
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            if (i % markerStep === 0) {
              ctx.beginPath(); ctx.arc(q.x, q.y, 3.4 + tone.value * 2.3, 0, Math.PI * 2);
              ctx.fillStyle = `hsl(${tone.hue}, 94%, 57%)`; ctx.fill();
              ctx.strokeStyle = "rgba(255,255,255,.78)"; ctx.lineWidth = .75; ctx.stroke();
            }
          }
        }
        ctx.lineWidth = 1.25;
        if (mode === "speed") {
          ctx.beginPath();
          pos.forEach((q, i) =>
            i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y),
          );
          ctx.strokeStyle = "rgba(255,239,220,.54)";
          ctx.stroke();
        } else {
          for (let i = 1; i < n; i++) {
            let q = pos[i],
              prev = pos[i - 1];
            ctx.strokeStyle = palette(q.p.gradeS);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(pos[0].x, pos[0].y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#22c7b0";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pos[n - 1].x, pos[n - 1].y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#e8602c";
        ctx.fill();
        let ix = Math.min(n - 1, Math.round(progress * (n - 1))),
          cur = pos[ix];
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,225,92,.16)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffe15c";
        ctx.fill();
        let ratio = Math.max(0.25, Math.min(1.75, cur.p.speedS / (avg || 1))),
          angle = (ratio / 1.75) * 270;
        $("#speedo").style.setProperty("--angle", angle + "deg");
        $("#speedo").style.setProperty("--needle", angle - 135 + "deg");
        $("#speedValue").textContent = cur.p.speedS.toFixed(1);
        $("#speedLabel").textContent =
          (ratio >= 1 ? "FASTER" : "SLOWER") + " · AVG " + avg.toFixed(1);
        updateEvent(cur.p);
        $("#time").textContent = fmtDuration(
          (cur.p.time - analysis.start) / 1000,
        );
        $("#scrubber").value = progress;
        drawElevationChart();
        drawSpeedChart();
      }
      // Show a short label only while playback is close to a detected route event.
      function updateEvent(p) {
        let nearest = analysis.events.reduce((a, e) =>
            Math.abs(e.p.cum - p.cum) < Math.abs(a.p.cum - p.cum) ? e : a,
          ),
          visible = Math.abs(nearest.p.cum - p.cum) < analysis.total * 0.018;
        $("#eventBox").classList.toggle("visible", visible);
        if (visible) {
          $("#eventTitle").textContent = nearest.label;
          $("#eventText").textContent =
            nearest.detail + " · km " + (nearest.p.cum / 1000).toFixed(1);
        }
      }
      // Build an English legend that reflects the current activity's maximum speed.
      function renderLegend() {
        let maxSpeed = analysis.maxSpeed,
          minSpeed = analysis.minSpeed,
          items =
            mode === "speed"
              ? [
                  [`hsl(${speedScale(minSpeed, maxSpeed, minSpeed).hue},88%,58%)`, `${minSpeed.toFixed(1)} km/h slow`],
                  [
                    `hsl(${speedScale((maxSpeed + minSpeed) / 2, maxSpeed, minSpeed).hue},88%,58%)`,
                    "medium pace",
                  ],
                  [
                    `hsl(${speedScale(maxSpeed, maxSpeed, minSpeed).hue},88%,58%)`,
                    `${maxSpeed.toFixed(1)} km/h max`,
                  ],
                ]
              : [
                  ["#a985ff", "Downhill"],
                  ["#e8752e", "Flat"],
                  ["#95ee3c", "Uphill"],
                ];
        $("#legend").innerHTML =
          `<div class="key"><i class="swatch" style="background:#16679b"></i>Topography</div><div class="key"><i class="dot"></i>Current position</div>` +
          items
            .map(
              (x) =>
                `<div class="key"><i class="swatch" style="background:${x[0]}"></i>${x[1]}</div>`,
            )
            .join("");
      }
      // Animation loop: advance the shared playback progress over approximately 45 seconds.
      function tick(t) {
        if (playing) {
          progress += (t - last) / 45000;
          if (progress >= 1) {
            progress = 1;
            playing = false;
            $("#play").textContent = "Play";
          }
          last = t;
          draw();
          requestAnimationFrame(tick);
        }
      }
      $("#play").onclick = () => {
        playing = !playing;
        $("#play").textContent = playing ? "Pause" : "Play";
        last = performance.now();
        if (playing) requestAnimationFrame(tick);
      };
      $("#scrubber").oninput = (e) => {
        progress = +e.target.value;
        draw();
      };
      document.querySelectorAll("[data-mode]").forEach(
        (b) =>
          (b.onclick = () => {
            mode = b.dataset.mode;
            document
              .querySelectorAll("[data-mode]")
              .forEach((x) => x.classList.toggle("active", x === b));
            $("#modeLabel").textContent =
              "Mode: " + (mode === "speed" ? "speed" : "grade");
            renderLegend();
            draw();
          }),
      );
      // Fit the OpenStreetMap background to the bounds of the current GPX route.
      function updateMapBounds() {
        let pts = analysis.points;
        if (!pts?.length) return;
        let lats = pts.map((p) => p.lat),
          lons = pts.map((p) => p.lon),
          south = Math.min(...lats),
          north = Math.max(...lats),
          west = Math.min(...lons),
          east = Math.max(...lons),
          mid = (south + north) / 2,
          cos = Math.max(0.18, Math.cos((mid * Math.PI) / 180)),
          r = $("#visual").getBoundingClientRect(),
          ratio = r.width / Math.max(1, r.height),
          latSpan = Math.max(0.006, (north - south) * 1.32),
          lonSpan = Math.max(0.006, (east - west) * 1.32),
          metersRatio = (lonSpan * cos) / latSpan;
        if (metersRatio < ratio) lonSpan = (latSpan * ratio) / cos;
        else latSpan = (lonSpan * cos) / ratio;
        let cLat = (south + north) / 2,
          cLon = (west + east) / 2,
          bbox = [
            cLon - lonSpan / 2,
            cLat - latSpan / 2,
            cLon + lonSpan / 2,
            cLat + latSpan / 2,
          ]
            .map((v) => v.toFixed(6))
            .join("%2C"),
          map = document.querySelector(".map-layer");
        if (map)
          map.src =
            "https://www.openstreetmap.org/export/embed.html?bbox=" +
            bbox +
            "&layer=mapnik";
      }
      // A profile is kept locally for the static build and is also sent to the optional API when it is available.
      function getProfile() {
        return JSON.parse(localStorage.getItem("pathFrequencyProfile") || "null");
      }
      const getSavedRoutes = () => JSON.parse(localStorage.getItem("pathFrequencyRoutes") || "[]");
      const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
      function updateProfileCard() {
        const profile = getProfile();
        const saved = getSavedRoutes();
        $("#profileName").textContent = profile?.name || "Guest athlete";
        $("#profileAvatar").textContent = profile?.name ? profile.name.slice(0, 2).toUpperCase() : "PF";
        $("#profileCount").textContent = `${saved.length} saved route${saved.length === 1 ? "" : "s"}`;
        $("#profileButton").textContent = profile?.name ? "Edit profile" : "Create profile";
      }
      $("#profileButton").onclick = () => {
        const existing = getProfile();
        $("#profileNameInput").value = existing?.name || "";
        $("#profileEmailInput").value = existing?.email || "";
        $("#profileDialog").showModal();
      };
      $("#profileForm").onsubmit = async (e) => {
        e.preventDefault();
        const existing = getProfile();
        const profile = { id: existing?.id || crypto.randomUUID(), name: $("#profileNameInput").value.trim(), email: $("#profileEmailInput").value.trim() };
        if (!profile.name) return;
        localStorage.setItem("pathFrequencyProfile", JSON.stringify(profile));
        updateProfileCard();
        $("#profileDialog").close();
        try {
          await apiFetch("/api/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
          // Attach routes saved before the profile was created, so the local library and backend stay aligned.
          await Promise.all(getSavedRoutes().map((route) => apiFetch("/api/routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: profile.id, route }) })));
          await syncRoutesFromBackend();
        } catch (_) { /* Direct static hosting remains fully usable with local storage. */ }
      };
      document.querySelectorAll("[data-close]").forEach((button) => button.onclick = () => $("#" + button.dataset.close).close());
      function renderInsightDetails(place) {
        const p = analysis.points, mid = p[Math.floor(p.length / 2)], sport = $("#sport").value;
        const elevationSpan = Math.round(analysis.maxEle - analysis.minEle);
        const ascent = Math.round(analysis.up);
        const character = elevationSpan > 700 || ascent > 900 ? "mountainous" : elevationSpan > 250 ? "rolling" : "mostly flat";
        const distance = analysis.total / 1000;
        const duration = Math.max(1, (analysis.end - analysis.start) / 1000);
        const average = (analysis.total / duration) * 3.6;
        const floors = Math.round(ascent / 3);
        const spread = analysis.maxSpeed - analysis.minSpeed;
        $("#insightPlace").textContent = place || `Route near ${mid.lat.toFixed(3)}, ${mid.lon.toFixed(3)}`;
        $("#insightText").textContent = `${sport} route with ${character} terrain. The information below is derived from the uploaded GPX.`;
        $("#insightTags").innerHTML = [`${sport}`, `${distance.toFixed(1)} km`, `${analysis.maxSpeed.toFixed(1)} km/h max`].map(x => `<span>${x}</span>`).join("");
        $("#insightFacts").innerHTML = [
          `<b>${distance.toFixed(1)} km</b> of total distance`,
          `<b>${ascent.toLocaleString("en-US")} m</b> of accumulated ascent`,
          `Altitude range: <b>${Math.round(analysis.minEle).toLocaleString("en-US")}–${Math.round(analysis.maxEle).toLocaleString("en-US")} m</b>`,
          `Pace: <b>${analysis.minSpeed.toFixed(1)}–${analysis.maxSpeed.toFixed(1)} km/h</b> · average ${average.toFixed(1)} km/h`
        ].map(x => `<li>${x}</li>`).join("");
        $("#insightCuriosities").innerHTML = [
          `The climbing total is roughly equivalent to <b>${floors.toLocaleString("en-US")} floors</b>.`,
          elevationSpan > 700 ? `The route crosses a <b>${elevationSpan.toLocaleString("en-US")} m vertical band</b>, so conditions may change noticeably along the way.` : `Its <b>${elevationSpan.toLocaleString("en-US")} m elevation band</b> makes the terrain easier to read from the profile.`,
          spread > 12 ? `There is a <b>${spread.toFixed(1)} km/h pace spread</b>; the colored line highlights where effort or terrain changed most.` : `The pace is comparatively steady: only <b>${spread.toFixed(1)} km/h</b> separates the route extremes.`,
          `The highest recorded point is <b>${Math.round(analysis.maxEle).toLocaleString("en-US")} m</b>; use the profiles to locate it in the route.`
        ].map(x => `<li>${x}</li>`).join("");
        // Regional context is displayed only for the high-Andean Los Nevados / Quindío area,
        // rather than making geographic claims about every uploaded GPX.
        const inLosNevadosRegion = mid.lat > 4.45 && mid.lat < 4.95 && mid.lon > -75.68 && mid.lon < -75.25;
        const placeContext = $("#placeContext");
        placeContext.hidden = !inLosNevadosRegion;
        if (inLosNevadosRegion) {
          $("#placeFacts").innerHTML = [
            `This route is in the <b>high-Andean landscape of Quindío and Los Nevados</b>, one of Colombia's highest mountain regions.`,
            `Los Nevados National Natural Park was <b>officially protected in 1974</b> and spans parts of Quindío, Caldas, Risaralda and Tolima.`,
            `The upper ecosystems include <b>páramo</b>, a water-regulating landscape where <b>frailejones</b> are emblematic plants.`,
            `Your recorded high point is <b>${Math.round(analysis.maxEle).toLocaleString("en-US")} m</b>, which explains the rapid terrain and weather changes hikers often prepare for in this region.`
          ].map(x => `<li>${x}</li>`).join("");
        }
      }
      function localInsight() {
        renderInsightDetails();
      }
      async function updateRoutePhoto(point) {
        const photo = $("#routePhoto"), image = $("#routePhotoImage"), credit = $("#routePhotoCredit");
        photo.hidden = true;
        image.removeAttribute("src");
        try {
          const response = await apiFetch(`/api/route-photo?lat=${encodeURIComponent(point.lat)}&lon=${encodeURIComponent(point.lon)}`);
          if (!response.ok) return;
          const result = await response.json();
          if (!result?.url || !/^https:\/\//.test(result.url)) return;
          image.src = result.url;
          image.alt = result.title || "Photo near this route";
          credit.href = result.pageUrl || "https://commons.wikimedia.org/";
          credit.textContent = `${result.author}${result.license ? ` · ${result.license}` : ""}`;
          photo.hidden = false;
        } catch (_) { /* Do not substitute an unrelated image when no real local photo is available. */ }
      }
      async function updateRouteInsight() {
        localInsight();
        const p = analysis.points[Math.floor(analysis.points.length / 2)];
        updateRoutePhoto(p);
        try {
          const response = await apiFetch("/api/route-insight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: p.lat, lon: p.lon, sport: $("#sport").value, distanceKm: analysis.total / 1000, ascent: analysis.up, minElevation: analysis.minEle, maxElevation: analysis.maxEle, minSpeed: analysis.minSpeed, maxSpeed: analysis.maxSpeed }) });
          if (!response.ok) return;
          const insight = await response.json();
          renderInsightDetails(insight.place);
          if (insight.description) $("#insightText").textContent = insight.description;
          if (insight.tags?.length) $("#insightTags").innerHTML = insight.tags.map(x => `<span>${x}</span>`).join("");
        } catch (_) { /* The local route reading is the privacy-preserving fallback. */ }
      }
      /* =============================================================================
         GPX IMPORT AND LOCAL STORAGE
         -----------------------------------------------------------------------------
         Parse a local file and restore saved browser routes.
         ============================================================================= */
      $("#file").onchange = async (e) => {
        let f = e.target.files[0];
        if (!f) return;
        try {
          let text = await f.text(),
            xml = new DOMParser().parseFromString(text, "application/xml");
          if (xml.querySelector("parsererror")) throw Error("invalid file");
          let raw = [...xml.querySelectorAll("trkpt")]
            .map((q) => ({
              lat: +q.getAttribute("lat"),
              lon: +q.getAttribute("lon"),
              ele: +q.querySelector("ele")?.textContent,
              time: new Date(q.querySelector("time")?.textContent),
            }))
            .filter(
              (p) =>
                Number.isFinite(p.lat) &&
                Number.isFinite(p.lon) &&
                Number.isFinite(p.ele) &&
                !isNaN(p.time),
            );
          if (raw.length < 3) throw Error("missing points");
          data = reducePoints(raw);
          analysis = analyze(data);
          progress = 0;
          zoom = 1;
          pan = { x: 0, y: 0 };
          syncMap();
          setStats();
          renderLegend();
          updateMapBounds();
          $("#routeName").textContent = f.name.replace(/\.gpx$/i, "");
          $("#dataStatus").textContent = "Route loaded";
          updateRouteInsight();
          draw();
        } catch (err) {
          $("#dataStatus").textContent = "Could not read GPX";
          console.error(err);
        }
      };
      // Read locally cached routes and render a usable route library. The server copy is synchronized on opening it.
      function loadSavedRoute(r) {
        if (!r?.points?.length) return;
        data = r.points.map((p) => ({ ...p, time: new Date(p.time) }));
        analysis = analyze(data);
        progress = 0; zoom = 1; pan = { x: 0, y: 0 };
        syncMap(); updateMapBounds();
        $("#routeName").textContent = r.name;
        $("#sport").value = r.sport || "Hiking";
        setStats(); renderLegend(); updateRouteInsight(); draw();
        $("#routesDialog").close();
        $("#dataStatus").textContent = "Saved route loaded";
      }
      function renderLibrary() {
        let saved = getSavedRoutes();
        $("#routeDots").innerHTML = saved
          .map(
            (r, i) =>
              `<button type="button" data-saved="${i}">${escapeHtml(r.sport)} · ${escapeHtml(r.name)}</button>`,
          )
          .join("");
        $("#savedRoutesList").innerHTML = saved.length ? saved.map((r, i) => {
          const stats = r.stats || {};
          const date = r.savedAt ? new Date(r.savedAt).toLocaleDateString() : "Saved in this browser";
          return `<article class="saved-route"><div class="saved-route__sport">${escapeHtml(r.sport || "Activity")}</div><div class="saved-route__body"><h3>${escapeHtml(r.name || "Untitled route")}</h3><p>${date} · ${stats.distance ? `${stats.distance} km` : `${r.points?.length || 0} route points`} ${stats.ascent ? `· ${stats.ascent} m ascent` : ""}</p></div><button type="button" data-load-route="${i}">Open route</button></article>`;
        }).join("") : `<div class="empty-routes"><b>No saved routes yet</b><span>Import a GPX, choose the activity, then select Save route.</span></div>`;
        document.querySelectorAll("[data-saved]").forEach(
          (b) => (b.onclick = () => loadSavedRoute(saved[+b.dataset.saved])),
        );
        document.querySelectorAll("[data-load-route]").forEach((b) => (b.onclick = () => loadSavedRoute(saved[+b.dataset.loadRoute])));
      }
      async function syncRoutesFromBackend() {
        const profile = getProfile();
        if (!profile) return;
        try {
          const response = await apiFetch(`/api/users/${encodeURIComponent(profile.id)}/routes`);
          if (!response.ok) return;
          const remote = await response.json();
          const merged = [...remote, ...getSavedRoutes()].reduce((unique, route) => unique.has(route.id) ? unique : unique.set(route.id, route), new Map());
          localStorage.setItem("pathFrequencyRoutes", JSON.stringify([...merged.values()].slice(0, 30)));
          renderLibrary(); updateProfileCard();
        } catch (_) { /* Local cache is still available when the API is offline. */ }
      }
      $("#routesButton").onclick = async () => {
        renderLibrary();
        $("#routesDialog").showModal();
        await syncRoutesFromBackend();
      };
      $("#saveRoute").onclick = () => {
        if (!getProfile()) {
          $("#profileNameInput").value = "";
          $("#profileEmailInput").value = "";
          $("#profileDialog").showModal();
          $("#dataStatus").textContent = "Create your profile to save routes";
          return;
        }
        let saved = getSavedRoutes(),
          name = $("#routeName").textContent || "Untitled route";
        const route = {
          id: crypto.randomUUID(),
          name,
          sport: $("#sport").value,
          savedAt: new Date().toISOString(),
          stats: { distance: (analysis.total / 1000).toFixed(1), ascent: Math.round(analysis.up) },
          points: data.map((p) => ({ ...p, time: p.time.toISOString() })),
        };
        saved.unshift(route);
        localStorage.setItem(
          "pathFrequencyRoutes",
          JSON.stringify(saved.slice(0, 30)),
        );
        renderLibrary();
        updateProfileCard();
        $("#dataStatus").textContent = "Route saved";
        const profile = getProfile();
        if (profile) apiFetch("/api/routes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: profile.id, route }) }).catch(() => {});
      };
      /* =============================================================================
         VIEW INTERACTION
         -----------------------------------------------------------------------------
         Keep the canvas and map together during zoom, drag, reset, and opacity.
         ============================================================================= */
      const view = $("#visual"),
        syncMap = () =>
          document
            .querySelector(".map-layer")
            ?.style.setProperty(
              "transform",
              `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            );
      $("#resetView").onclick = () => {
        zoom = 1;
        pan = { x: 0, y: 0 };
        syncMap();
        updateMapBounds();
        draw();
      };
      view.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          let r = view.getBoundingClientRect(),
            mx = e.clientX - r.left - r.width / 2,
            my = e.clientY - r.top - r.height / 2,
            old = zoom;
          zoom = Math.max(
            0.7,
            Math.min(3, zoom * (e.deltaY < 0 ? 1.12 : 0.89)),
          );
          let factor = zoom / old;
          pan = {
            x: mx - (mx - pan.x) * factor,
            y: my - (my - pan.y) * factor,
          };
          syncMap();
          draw();
        },
        { passive: false },
      );
      view.addEventListener("pointerdown", (e) => {
        if (e.target.closest("button,input,select,label")) return;
        drag = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        view.setPointerCapture(e.pointerId);
        view.style.cursor = "grabbing";
      });
      view.addEventListener("pointermove", (e) => {
        if (!drag) return;
        pan = { x: e.clientX - drag.x, y: e.clientY - drag.y };
        syncMap();
        draw();
      });
      view.addEventListener("pointerup", (e) => {
        drag = null;
        view.style.cursor = "grab";
      });
      view.style.cursor = "grab";
      new ResizeObserver(() => {
        resize();
        draw();
      }).observe(canvas.parentElement);
      setStats();
      renderLegend();
      renderLibrary();
      updateProfileCard();
      resize();
      updateMapBounds();
      updateRouteInsight();
      draw();
      document.getElementById("mapOpacity").addEventListener("input", (e) => {
        const map = document.querySelector(".map-layer");
        if (map) map.style.opacity = (Number(e.target.value) / 100).toString();
      });
      $("#sport").addEventListener("change", updateRouteInsight);
