# Transit Tracker — Singapore MRT & Paris Métro

An interactive web app showing complete metro networks with live GPS
geolocation to find the station nearest to you. A header dropdown switches
between networks.

## Networks

### Singapore MRT / LRT
All operating MRT lines (North South, East West, Circle, North East,
Downtown, Thomson-East Coast) plus the Changi Airport branch, and all
three LRT systems (Bukit Panjang, Sengkang, Punggol) — 185 stations
total, including the Circle Line Stage 6 stations (Keppel, Cantonment,
Prince Edward Road) that closed the loop in July 2026.

### Paris Métro
All 16 lines (1–14, 3bis, 7bis) with official RATP line colours — 321
stations, current as of the 2024 extensions (line 14 to Aéroport d'Orly
and Saint-Denis–Pleyel, line 11 to Rosny–Bois-Perrier, line 12 to Mairie
d'Aubervilliers). The line 7 and line 13 forks are drawn as proper
branches.

## Features

- Maps are plotted from real station coordinates (equirectangular
  projection, latitude-corrected), so they're geographically accurate, not
  just stylized diagrams — your GPS position lands in the right place
  relative to stations.
- "Locate Me" uses `navigator.geolocation.watchPosition` to continuously
  track your position and highlight the nearest station, with a live
  distance readout and a ranked "nearby stations" list.
- Accent-insensitive search by station name or line code ("chatelet" finds
  Châtelet), click any station for details, toggle line visibility
  (branches follow their parent line), pan/zoom with full touch support
  (pinch-to-zoom, clamped panning).
- Station details show estimated first/last train times per line
  (Singapore only for now). These are derived from line topology and
  typical operating hours by `scripts/generate_timings.py` — the exact
  per-station schedules published by SMRT/SBS Transit are not available
  as machine-readable open data. The UI reads
  `src/data/singapore/timings.json` as-is, so real scraped data can be
  swapped in without code changes.
- A Transit / Heritage mode toggle (Singapore only): in Heritage mode,
  clicking a station shows its year of first opening and a short
  curated note on the origin of its name
  (`scripts/build_history.py` → `src/data/singapore/history.json`).
  Opening years follow the documented line-opening stages; name origins
  are concise summaries of commonly documented etymologies and are
  flagged as curated in the UI.

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

Data lives in `src/data/<network>/{stations,lines}.json`; networks are
registered in `src/data/networks.ts`.

**Singapore**: station coordinates from
[xkjyeah/MRT-and-LRT-Stations](https://github.com/xkjyeah/MRT-and-LRT-Stations)
cross-referenced with known line topology and official station codes. A
few newer/unlisted stations were added manually (e.g. Havelock, Punggol
Coast), and the Circle Line Stage 6 stations use coordinates from
[cheeaun/sgraildata](https://github.com/cheeaun/sgraildata).

**Paris**: station coordinates and line membership from the June-2024
`gt::metro` dataset mirrored in
[Rdatasets](https://github.com/vincentarelbundock/Rdatasets), with line
colours from [Sml995/metro_data](https://github.com/Sml995/metro_data)
(RATP open data). Station order along each line is reconstructed
geometrically (nearest-neighbour + 2-opt between known termini), with the
line 7 / line 13 branches defined explicitly.

Known limitations:
- Coordinates are accurate to roughly building/station-entrance level, not
  survey-grade — fine for "which station am I near" but not precise enough
  for exact platform-level positioning.
- Singapore LRT loop ordering and the Paris line 10 Auteuil one-way loop
  are drawn in a simplified geometric order rather than the exact
  operational sequence, which only affects how the polyline is drawn.
- Unopened/future stations (e.g. Sungei Bedok, Bukit Brown, Hume) and the
  Sentosa Express monorail are excluded; Paris RER, tram and Transilien
  networks are out of scope.
