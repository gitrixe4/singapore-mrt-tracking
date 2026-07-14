"""Generate estimated first/last train times per station per line.

Real per-station schedules are published by SMRT/SBS Transit but not as
machine-readable open data, so this derives estimates from line topology:
trains leave both termini at FIRST_DEP / LAST_DEP and take HOP minutes
between adjacent stations. The first arrival at a station comes from its
nearer terminus, the last arrival from its farther one. Loops (closed
paths) measure hop distance around the circle.

Output: src/data/singapore/timings.json
  { stationId: { lineId: { "first": "HH:MM", "last": "HH:MM" } } }

Replace this file's output with real scraped data when available; the UI
reads the JSON as-is.
"""

import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "singapore")

FIRST_DEP = 5 * 60 + 30   # 05:30 terminus departure
LAST_DEP = 23 * 60 + 30   # 23:30 terminus departure
HOP_MRT = 2.5             # minutes between adjacent MRT stations
HOP_LRT = 1.5             # minutes between adjacent LRT stations

LRT_LINES = {"BP", "SK", "PG"}

lines = json.load(open(os.path.join(BASE, "lines.json")))

def fmt(minutes):
    m = round(minutes) % (24 * 60)
    return f"{m // 60:02d}:{m % 60:02d}"

timings = {}

for line in lines:
    path = line["path"]
    hop = HOP_LRT if line["id"] in LRT_LINES else HOP_MRT
    is_loop = path[0] == path[-1]
    stops = path[:-1] if is_loop else path
    n = len(stops)
    for i, sid in enumerate(stops):
        if is_loop:
            around = min(i, n - i)          # hops from the loop's start station
            near, far = around, n // 2      # farthest point on a loop is half way
        else:
            near = min(i, n - 1 - i)
            far = max(i, n - 1 - i)
        entry = {
            "first": fmt(FIRST_DEP + near * hop),
            "last": fmt(LAST_DEP + far * hop),
        }
        timings.setdefault(sid, {})[line["id"]] = entry

out = os.path.join(BASE, "timings.json")
json.dump(timings, open(out, "w"), indent=2, sort_keys=True)
print(f"wrote {out}: {len(timings)} stations")
