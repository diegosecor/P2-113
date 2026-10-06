# Path Frequency code guide

The app is intentionally a dependency-free static website so it is easy to run and explain. The code is separated by responsibility:

- `../dist/index.html` contains the page structure and visible controls.
- `../dist/styles.css` contains the visual design and responsive layout.
- `../dist/app.js` contains GPX analysis, Canvas drawing, import, saved routes, and interaction.

## Main sections

| Section | Responsibility |
| --- | --- |
| HTML controls | Provides import, sport, save, playback, map opacity, and view controls. |
| CSS | Places the visual field and its small information panels, while keeping the map and chart unobtrusive. |
| `makeDemo()` | Supplies a sample route before an activity is imported. |
| `hav()` | Uses the Haversine formula to calculate ground distance between two latitude/longitude points. |
| `reducePoints()` | Limits long GPX files to 600 visual samples so panning and playback remain smooth. |
| `analyze()` | Calculates cumulative distance, elevation change, smoothed speed, and grade. |
| `positions()` | Projects geographic coordinates into the canvas coordinate system. |
| `speedScale()` | Divides each smoothed speed by the maximum smoothed speed of the current activity, returning a value between 0 and 1. |
| `draw()` | Draws topographic contours, circular samples, the proportional speed halo, copper route core, endpoints, and current marker. |
| `drawElevationChart()` | Draws the complete elevation profile and the playback marker. |
| `updateMapBounds()` | Builds an OpenStreetMap bounding box from the route's geographic extent. |

## Comment conventions

The source uses two English comment styles so it remains easy to present and review on GitHub:

- **Small notes** begin with `//` in JavaScript or `<!-- -->` in HTML. They explain a nearby decision, fallback, or UI element.
- **Section notes** use a block with a title and a horizontal separator above and below the description. They introduce each major area of the app, such as route analysis, Canvas rendering, storage, and interaction.

GitHub applies comment colours according to the visitor's selected theme. The separator format makes the larger notes easy to find even when the colour differs.

## Speed colour rule

For every route point, Path Frequency calculates:

```text
normalised speed = point smoothed speed / activity maximum smoothed speed
```

The normalised value is clamped to `0…1` and mapped from a red hue at `0` to a green hue at `1`. This makes the colour reading relative to the individual activity rather than a fixed speed threshold. The thin copper core remains constant so the route is always readable over the map.

## Elevation chart

The chart uses the same analysed GPX points as the route. Its horizontal axis represents the progression through the activity and its vertical axis represents elevation. The yellow dot uses the same `progress` value as the main playback marker, so both views move together.

## Import and privacy

The import handler uses `DOMParser` to read GPX track points in the browser. A GPX file is not sent during import. Choosing **Save route** stores the sampled route locally and, when the deployed API is available, synchronises it with the selected profile.

## Explaining the project in a presentation

1. A GPX is a sequence of latitude, longitude, elevation, and time records.
2. The app turns consecutive records into distance, speed, and grade.
3. It samples long activities before drawing them so the interaction remains fluid.
4. The map establishes location, the route halo shows relative speed, and the elevation profile summarises vertical movement.

## Code review: fixes and simplification notes

The source file now begins with an English **CODE MAP** and every major CSS, HTML, data, analysis, rendering, import, storage, and interaction block has an English explanation beside it. This is deliberate: the app is a single-file static project, so comments make the architecture easier to explain without adding a framework or backend.

Two defensive fixes were made during review:

1. **Stationary routes:** the slowest-section calculation previously assumed that at least one sample had a positive speed. A route with only zero-speed samples could make `reduce()` fail. It now falls back to all samples.
2. **Equal timestamps:** average speed now protects against a zero-duration activity, so the speed indicator cannot display `Infinity`.

Small unused colour variables were removed. The remaining CSS is intentionally layered: the first layer provides readable fallback styles, while later layers refine the full-screen desktop composition. That keeps the current visual design stable, but a future refactor could combine those style blocks into one stylesheet once the visual design is final.

### Known design trade-offs

- Saved routes are stored locally first and are synchronised with the optional API for a selected profile. The server's file store is suitable for a small demonstration deployment rather than a multi-user production database.
- The OpenStreetMap iframe is a visual context layer, not a precise GIS overlay. The canvas uses a simpler projection, so the app recalculates bounds on import rather than claiming metre-perfect alignment.
