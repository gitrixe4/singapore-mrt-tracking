# Singapore MRT / LRT Tracker

An interactive web app showing the full Singapore MRT and LRT network, with
live GPS geolocation to find the station nearest to you.

## Features

- All operating MRT lines (North South, East West, Circle, North East,
  Downtown, Thomson-East Coast) plus the Changi Airport and Circle Line
  Extension branches, and all three LRT systems (Bukit Panjang, Sengkang,
  Punggol) — 182 stations total.
- Map is plotted from real station coordinates (equirectangular projection,
  latitude-corrected), so it's geographically accurate, not just a stylized
  diagram — your GPS position lands in the right place relative to stations.
- "Locate Me" uses `navigator.geolocation.watchPosition` to continuously
  track your position and highlight the nearest station, with a live
  distance readout and a ranked "nearby stations" list.
- Search by station name or code, click any station for details, toggle
  line visibility, pan/zoom the map.

## Running locally

```bash
npm install
npm run dev
```

## Deploying

```bash
npm run build
```

Outputs static files to `dist/`, deployable to any static host (Vercel,
Netlify, GitHub Pages, S3, etc.).

**Important:** Browser geolocation requires a secure context — it only
works over `https://` or on `localhost`. If you deploy this, make sure it's
served over HTTPS or the "Locate Me" button will fail silently in most
browsers.

## Data

Station coordinates are sourced from a public geocoded dataset
([xkjyeah/MRT-and-LRT-Stations](https://github.com/xkjyeah/MRT-and-LRT-Stations))
cross-referenced with known line topology and official station codes
(`src/data/stations.json`, `src/data/lines.json`). A few newer/unlisted
stations were added manually (e.g. Havelock, Punggol Coast).

Known limitations:
- Coordinates are accurate to roughly building/station-entrance level, not
  survey-grade — fine for "which station am I near" but not precise enough
  for exact platform-level positioning.
- LRT loop station ordering (Bukit Panjang, Sengkang, Punggol) is derived
  geometrically (angle around the interchange) rather than from official
  operational sequence, since it only affects how the loop is drawn, not
  station data.
- Unopened/future stations (e.g. Sungei Bedok, Bukit Brown, Mount Pleasant,
  Hume) and the Sentosa Express monorail are excluded, since the app is
  scoped to the currently operating MRT/LRT network.
