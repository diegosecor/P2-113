# Path Frequency

Path Frequency turns a GPX activity into an interactive visual route. Instead of a conventional fitness dashboard, it uses colour, movement, elevation, and geometric drawing to reveal the character of a hike, run, or bike ride.

## Live app

[**Open Path Frequency**](https://diegosecor.github.io/P2-113/)

## What it shows

- A copper route line with a red-to-green speed glow: red is slower and green is faster relative to the activity's maximum speed.
- A topographic-style field of blue echoes and turquoise circles inspired by computational design.
- An elevation profile synchronized with the route playback.
- A subtle OpenStreetMap background for geographic context.

## How to use it

1. Select **Import GPX** and choose a GPX file.
2. Choose the activity type: Hiking, Running, or Bike.
3. Switch between **Speed** and **Grade**, use **Play** or the timeline, and drag/zoom to inspect the route.
4. Use **Map opacity** or **Center route** to adjust the view.

## Project structure

```text
dist/index.html  # Page structure
dist/styles.css  # Visual design and layout
dist/app.js      # GPX analysis, drawing, import, and interaction
data/            # Optional GPX test files
docs/            # Code guide
prompt_log.md    # AI-use record
```

## Technology and privacy

This is a dependency-free static web app. GPX files are analysed locally in the browser: there is no backend, login, Strava API, Google Maps API, or API key. OpenStreetMap provides the optional map background. Be mindful that GPX files can contain precise location data.

## Run locally

Open `dist/index.html` in a modern browser, or serve the `dist/` folder with any static server.

## AI use

The author directed the concept, visual reference, data, and design decisions. Codex supported implementation, debugging, documentation, and code review. See [prompt_log.md](prompt_log.md) for the development record.
