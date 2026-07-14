import type { Network, Station, LineMeta } from "../lib/geo";
import sgStations from "./singapore/stations.json";
import sgLines from "./singapore/lines.json";
import parisStations from "./paris/stations.json";
import parisLines from "./paris/lines.json";

export const NETWORKS: Network[] = [
  {
    id: "singapore",
    name: "Singapore MRT / LRT",
    stations: sgStations as Station[],
    lines: sgLines as LineMeta[],
  },
  {
    id: "paris",
    name: "Paris Métro",
    stations: parisStations as Station[],
    lines: parisLines as LineMeta[],
  },
];

export const DEFAULT_NETWORK_ID = "singapore";
