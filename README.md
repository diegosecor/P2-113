# Path Frequency

[Open the live app](https://diegosecor.github.io/P2-113/)

Path Frequency turns a GPX activity into an interactive visual route for hiking, running, or cycling. It combines a speed-coloured route, elevation and speed profiles, playback, and geographic context instead of a conventional fitness dashboard.

## What it does

- Imports a GPX and calculates distance, elevation, pace, grade, and route events.
- Colours every route from slow red through medium orange to fast green, using that route's own speed range.
- Lets the user play, scrub, pan, zoom, recenter, and adjust the map background.
- Creates an athlete profile and saves routes in **My routes** for later loading.
- Shows location context, route facts, and a credited real photo near the route when one is available.

## Features I am most proud of

The canvas makes speed changes readable without losing the route shape, and the two large synchronized profiles make elevation and pace easy to compare. I also connected the frontend to a small backend so saved routes and route context are not only a browser-only interaction.

## How to use it

1. Open the live app and select **Import GPX**.
2. Choose Hiking, Running, or Bike.
3. Explore Speed/Grade, playback, the profiles, and the map.
4. Create a profile, choose **Save route**, then use **My routes** to load it again.

## Architecture and local setup

The static frontend lives in `dist/` and is deployed with GitHub Pages. Its API is in the separate public repository [P2-113-backend](https://github.com/diegosecor/P2-113-backend), deployed on Render.

To run the backend locally:

```text
cd backend
npm start
```

Then serve the `dist/` folder with any static server. For deployed use, `dist/config.js` contains the public backend URL.

## Privacy, APIs, and secrets

GPX files are parsed in the browser. The backend receives route data only when a user chooses to save it. OpenStreetMap supplies the map; the backend uses OpenStreetMap reverse geocoding and Wikimedia Commons for nearby credited photographs. No API key is committed to this repository. Optional AI summaries require `OPENAI_API_KEY` and `OPENAI_MODEL` as server environment variables in Render.

## AI use

I directed the project concept, visual reference, requirements, and design revisions. I used Codex for implementation support, debugging, UI iteration, and review. The detailed, verbatim development record is in [prompt_log.md](prompt_log.md).
