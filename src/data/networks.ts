import type { Network, Station, LineMeta, NetworkTimings, NetworkHistory } from "../lib/geo";
import sgStations from "./singapore/stations.json";
import sgLines from "./singapore/lines.json";
import sgTimings from "./singapore/timings.json";
import sgHistory from "./singapore/history.json";
import parisStations from "./paris/stations.json";
import parisLines from "./paris/lines.json";

export const NETWORKS: Network[] = [
  {
    id: "singapore",
    name: "Singapore MRT / LRT",
    stations: sgStations as Station[],
    lines: sgLines as LineMeta[],
    timings: sgTimings as NetworkTimings,
    timingsNote:
      "Estimated from typical operating hours — check operator sites for exact times.",
    history: sgHistory as NetworkHistory,
    historyNote:
      "Curated summaries of commonly documented name origins.",
  },
  {
    id: "paris",
    name: "Paris Métro",
    stations: parisStations as Station[],
    lines: parisLines as LineMeta[],
  },
];

export const DEFAULT_NETWORK_ID = "singapore";
