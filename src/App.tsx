import { useMemo, useState } from "react";
import stationsData from "./data/stations.json";
import linesData from "./data/lines.json";
import type { Station, LineMeta } from "./lib/geo";
import { findNearestStations, formatDistance } from "./lib/geo";
import { useGeolocation } from "./lib/useGeolocation";
import MrtMap from "./components/MrtMap";
import "./App.css";

const stations = stationsData as Station[];
const lines = linesData as LineMeta[];

const MAIN_LINES = lines.filter((l) => !["CG", "CE"].includes(l.id));

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [hiddenLineIds, setHiddenLineIds] = useState<Set<string>>(new Set());
  const { status, position, error, start, stop } = useGeolocation();

  const visibleLineIds = useMemo(() => {
    const all = new Set(lines.map((l) => l.id));
    for (const id of hiddenLineIds) all.delete(id);
    return all;
  }, [hiddenLineIds]);

  const nearest = useMemo(() => {
    if (!position) return [];
    return findNearestStations(stations, position.lat, position.lng, 5);
  }, [position]);

  const nearestStation = nearest[0] ?? null;

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? null,
    [selectedStationId]
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.lines.some((l) => l.code.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query]);

  const toggleLine = (id: string) => {
    setHiddenLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Singapore MRT / LRT Tracker</h1>
        <div className="locate-controls">
          {status === "tracking" || status === "locating" ? (
            <button className="btn btn-stop" onClick={stop}>
              {status === "locating" ? "Locating…" : "Stop Tracking"}
            </button>
          ) : (
            <button className="btn btn-locate" onClick={start}>
              📍 Locate Me
            </button>
          )}
        </div>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      {nearestStation && (
        <div className="banner banner-nearest">
          You're nearest to <strong>{nearestStation.name}</strong>{" "}
          ({nearestStation.lines.map((l) => l.code).join(" / ")}) —{" "}
          {formatDistance(nearestStation.distance)} away
          {position && position.accuracy > 100 && (
            <span className="accuracy-note"> (GPS accuracy ±{Math.round(position.accuracy)}m)</span>
          )}
        </div>
      )}

      <div className="app-body">
        <aside className="sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search station or code (e.g. Bugis, NS24)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <ul className="search-results">
                {searchResults.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => {
                      setSelectedStationId(s.id);
                      setQuery("");
                    }}
                  >
                    <span>{s.name}</span>
                    <span className="codes">
                      {s.lines.map((l) => (
                        <span key={l.code} className="code-pill" style={{ background: l.color }}>
                          {l.code}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedStation && (
            <div className="station-detail">
              <h2>{selectedStation.name}</h2>
              <div className="codes">
                {selectedStation.lines.map((l) => (
                  <span key={l.code} className="code-pill" style={{ background: l.color }} title={l.lineName}>
                    {l.code}
                  </span>
                ))}
              </div>
              {position && (
                <p className="distance-line">
                  {formatDistance(
                    findNearestStations([selectedStation], position.lat, position.lng, 1)[0].distance
                  )}{" "}
                  from you
                </p>
              )}
              <button className="btn-clear" onClick={() => setSelectedStationId(null)}>
                Close
              </button>
            </div>
          )}

          {nearest.length > 0 && (
            <div className="nearby-list">
              <h3>Nearby stations</h3>
              <ul>
                {nearest.map((s) => (
                  <li
                    key={s.id}
                    className={s.id === selectedStationId ? "active" : ""}
                    onClick={() => setSelectedStationId(s.id)}
                  >
                    <span>{s.name}</span>
                    <span>{formatDistance(s.distance)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="legend">
            <h3>Lines</h3>
            <ul>
              {MAIN_LINES.map((l) => (
                <li key={l.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!hiddenLineIds.has(l.id)}
                      onChange={() => toggleLine(l.id)}
                    />
                    <span className="swatch" style={{ background: l.color }} />
                    {l.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="map-area">
          <MrtMap
            stations={stations}
            lines={lines}
            selectedStationId={selectedStationId}
            nearestStationId={nearestStation?.id ?? null}
            userPosition={position}
            onSelectStation={setSelectedStationId}
            visibleLineIds={visibleLineIds}
          />
        </main>
      </div>
    </div>
  );
}
