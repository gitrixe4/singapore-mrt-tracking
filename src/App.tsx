import { useMemo, useState } from "react";
import { NETWORKS, DEFAULT_NETWORK_ID } from "./data/networks";
import { findNearestStations, formatDistance } from "./lib/geo";
import { useGeolocation } from "./lib/useGeolocation";
import MrtMap from "./components/MrtMap";
import "./App.css";

// Accent-insensitive matching so "chatelet" finds "Châtelet".
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[–—]/g, "-")
    .toLowerCase();

export default function App() {
  const [networkId, setNetworkId] = useState<string>(() => {
    const saved = localStorage.getItem("network");
    return NETWORKS.some((n) => n.id === saved) ? saved! : DEFAULT_NETWORK_ID;
  });
  const network = NETWORKS.find((n) => n.id === networkId)!;
  const { stations, lines } = network;

  const [query, setQuery] = useState("");
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [hiddenLineIds, setHiddenLineIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"transit" | "heritage">("transit");
  const { status, position, error, start, stop } = useGeolocation();

  const switchNetwork = (id: string) => {
    setNetworkId(id);
    localStorage.setItem("network", id);
    setSelectedStationId(null);
    setHiddenLineIds(new Set());
    setQuery("");
    setMode("transit");
  };

  // Legend shows top-level lines; branch segments follow their parent.
  const mainLines = useMemo(() => lines.filter((l) => !l.parent), [lines]);
  const childrenOf = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of lines) {
      if (l.parent) m.set(l.parent, [...(m.get(l.parent) ?? []), l.id]);
    }
    return m;
  }, [lines]);

  const visibleLineIds = useMemo(() => {
    const all = new Set(lines.map((l) => l.id));
    for (const id of hiddenLineIds) all.delete(id);
    return all;
  }, [lines, hiddenLineIds]);

  const nearest = useMemo(() => {
    if (!position) return [];
    return findNearestStations(stations, position.lat, position.lng, 5);
  }, [stations, position]);

  const nearestStation = nearest[0] ?? null;

  const selectedStation = useMemo(
    () => stations.find((s) => s.id === selectedStationId) ?? null,
    [stations, selectedStationId]
  );

  const searchResults = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    return stations
      .filter(
        (s) =>
          fold(s.name).includes(q) ||
          s.lines.some((l) => fold(l.code).includes(q))
      )
      .slice(0, 8);
  }, [stations, query]);

  const toggleLine = (id: string) => {
    setHiddenLineIds((prev) => {
      const next = new Set(prev);
      const ids = [id, ...(childrenOf.get(id) ?? [])];
      if (next.has(id)) ids.forEach((i) => next.delete(i));
      else ids.forEach((i) => next.add(i));
      return next;
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Transit Tracker</h1>
        <div className="header-controls">
          <select
            className="network-select"
            value={networkId}
            onChange={(e) => switchNetwork(e.target.value)}
            aria-label="Choose network"
          >
            {NETWORKS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
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
          {network.history && (
            <div className="mode-toggle" role="tablist" aria-label="Station info mode">
              <button
                role="tab"
                aria-selected={mode === "transit"}
                className={mode === "transit" ? "active" : ""}
                onClick={() => setMode("transit")}
              >
                🚇 Transit
              </button>
              <button
                role="tab"
                aria-selected={mode === "heritage"}
                className={mode === "heritage" ? "active" : ""}
                onClick={() => setMode("heritage")}
              >
                🏛 Heritage
              </button>
            </div>
          )}

          <div className="search-box">
            <input
              type="text"
              placeholder="Search station or line"
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
              {mode === "heritage" && network.history?.[selectedStation.id] && (
                <div className="heritage">
                  <p className="heritage-opened">
                    Opened <strong>{network.history[selectedStation.id].opened}</strong>
                  </p>
                  {network.history[selectedStation.id].origin && (
                    <p className="heritage-origin">
                      {network.history[selectedStation.id].origin}
                    </p>
                  )}
                  {network.historyNote && (
                    <p className="timings-note">{network.historyNote}</p>
                  )}
                </div>
              )}
              {mode === "transit" && network.timings?.[selectedStation.id] && (
                <div className="timings">
                  <h4>First / last train</h4>
                  <ul>
                    {selectedStation.lines.map((l) => {
                      const t = network.timings![selectedStation.id][l.line];
                      if (!t) return null;
                      return (
                        <li key={l.line}>
                          <span className="code-pill" style={{ background: l.color }} title={l.lineName}>
                            {l.code}
                          </span>
                          <span className="timing-times">
                            First <strong>{t.first}</strong> · Last <strong>{t.last}</strong>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {network.timingsNote && (
                    <p className="timings-note">{network.timingsNote}</p>
                  )}
                </div>
              )}
              {mode === "transit" && position && (
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
              {mainLines.map((l) => (
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
            key={network.id}
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
