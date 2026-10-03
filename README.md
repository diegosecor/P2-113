# Path Frequency

**Path Frequency is an interactive visual reading of a GPX activity.** Instead of showing a conventional fitness dashboard, it turns a hike, run, or bike route into a moving graphic: the route becomes a copper line, speed becomes a red-to-green glow, elevation becomes a small profile, and playback lets the viewer travel through the activity.

The project is designed for someone who has a GPX file from a GPS device, Strava export, Garmin activity, or similar source and wants to understand the *character* of the route: where it moved slowly, where it moved quickly, how the elevation changed, and how the route sits in a geographic context.

> Path Frequency is a data visualisation, not a navigation tool or an exact GIS map. The OpenStreetMap layer is deliberately subtle and provides context and place labels behind the custom route drawing.

## What the app does

1. **Imports a GPX file locally.** The user chooses a `.gpx` file from their computer. Nothing is uploaded to an application server.
2. **Reads route data.** For every GPX track point, the app reads latitude, longitude, elevation, and timestamp.
3. **Calculates activity metrics.** It derives distance, ascent, descent, smoothed speed, and grade from nearby route points.
4. **Builds a visual route field.** Canvas draws blue topographic echoes, turquoise sampling circles, a speed-coloured halo, and a thin copper route spine.
5. **Supports exploration.** Users can switch between Speed and Grade, play the route, scrub its timeline, drag the view, zoom around the pointer, recenter the route, and adjust background-map opacity.

## Features I am most proud of

- **Activity-relative speed colour:** every route has a different pace, so speed is divided by the maximum speed of that specific activity. The slowest values are red, the fastest values are green, and the brightness/halo width makes the contrast easier to see.
- **Visual language inspired by computational design:** the blue contour echoes and turquoise circles reference a Grasshopper-style geometric field without pretending to be literal terrain contours.
- **Synchronized playback:** the yellow marker on the route and the marker in the elevation chart use the same progress value, so both views describe the same moment in the activity.
- **Performance-aware import:** long activities are reduced to 600 visual samples before drawing. The overall route shape remains recognisable while pan, zoom, and playback stay responsive.
- **Browser-local data:** the project works without an account, backend, API key, or Strava connection.

## How the visualisation works

### Route geometry

The app fits the imported latitude/longitude values into the available Canvas area. It applies a small longitude correction based on the average latitude so the route looks proportionate. This is suitable for a visual reading of one activity, but it is not a replacement for a GIS projection.

### Speed and grade

The app uses a small window of nearby route points to smooth speed and grade. This avoids letting one noisy GPS reading dominate the visualisation.

```text
normalised speed = smoothed point speed / maximum smoothed speed of this activity
```

The normalised value is clamped from `0` to `1` and mapped from red to green. In Grade mode, uphill and downhill sections receive their own colour treatment.

### Elevation profile

The elevation chart uses every displayed point in the imported route. Its horizontal axis follows route progress and its vertical axis shows elevation. The yellow chart marker follows the same playback position as the marker in the route view.

### Map background

An OpenStreetMap iframe is fitted to the route bounds after each import. It helps identify nearby mountains, towns, and roads, while the **Map opacity** slider keeps it secondary to the route graphic. Because the canvas and web map use different projections, the map is context rather than a metre-perfect overlay.

## How to use it

1. Open the app and select **Import GPX**.
2. Choose a GPX file with track points, elevation values, and timestamps.
3. Wait for the route, background-map extent, elevation profile, and speed field to update.
4. Choose **Hiking**, **Running**, or **Bike** for the activity category.
5. Use **Speed** or **Grade** to change the route reading.
6. Select **Play** or move the timeline slider to inspect individual moments.
7. Drag on open space to pan, use the mouse wheel to zoom around the pointer, and select **Center route** to restore the fitted view.
8. Use **Map opacity** to emphasize either the geographic context or the generated drawing.

The **Save route** button stores the current reduced route in this browser's local storage. Importing a GPX remains the normal way to switch activities in the current minimal interface.

## Privacy, services, and secrets

- GPX files are parsed in the browser. There is no project backend and no user account.
- The project does **not** use the Strava API, Google Maps API, or any API key.
- OpenStreetMap is used only as an embedded public map background, with attribution visible in the interface.
- Choosing **Save route** keeps sampled activity data in the current browser's local storage only.
- GPX files can reveal precise locations. Be thoughtful before committing personal GPX data to a public repository.

## Project structure

```text
P2-113/
├── dist/
│   ├── index.html      # Page structure and controls
│   ├── styles.css      # Visual design, layout, and responsive rules
│   └── app.js          # GPX analysis, Canvas drawing, import, and interaction
├── data/               # Optional GPX test files
├── docs/
│   └── CODE_GUIDE.md   # Technical explanation and code-review notes
├── prompt_log.md       # Development and AI-use record
└── README.md
```

## Run locally

No packages or build step are required.

- Open `dist/index.html` in a modern browser, or
- Serve the `dist/` folder with any static web server and open the local URL it provides.

For deployment, publish the contents of `dist/` to a static host such as GitHub Pages, Netlify, or Vercel. The app has no environment variables or secrets to configure.

## Limits of the current version

- The app expects GPX `trkpt` elements that include valid latitude, longitude, elevation, and time values.
- It is built to visualise one route at a time rather than provide turn-by-turn navigation.
- The map gives visual place context but should not be used for precise coordinate comparison.
- Saved data stays on one browser/device; it is not cloud-synchronised.

## AI use and sources

The project author directed the scope, visual reference, test data, visual decisions, and interface feedback. Codex was used for GPX inspection, implementation, debugging, code review, and documentation. The full record, including real prompts, tools used, and corrections made after AI mistakes, is in [`prompt_log.md`](prompt_log.md).

OpenStreetMap contributors are credited inside the embedded map. The project contains no private credentials or secret keys.
