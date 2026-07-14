export interface StationLine {
  line: string;
  code: string;
  color: string;
  lineName: string;
}

export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: StationLine[];
}

export interface LineMeta {
  id: string;
  name: string;
  color: string;
  path: string[];
  /** Branch segment that shows/hides with this parent line id. */
  parent?: string;
  /** Draw with a thinner stroke (e.g. LRT feeders). */
  thin?: boolean;
}

export interface LineTiming {
  first: string;
  last: string;
}

/** stationId -> lineId -> first/last arrival times */
export type NetworkTimings = Record<string, Record<string, LineTiming>>;

export interface Network {
  id: string;
  name: string;
  stations: Station[];
  lines: LineMeta[];
  timings?: NetworkTimings;
  /** Shown next to timings, e.g. to flag estimated data. */
  timingsNote?: string;
}

const EARTH_RADIUS_M = 6371000;

export function haversineDistanceMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

export function findNearestStations(
  stations: Station[],
  lat: number,
  lng: number,
  count = 5
): Array<Station & { distance: number }> {
  return stations
    .map((s) => ({ ...s, distance: haversineDistanceMeters(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

export interface Projection {
  x: (lng: number) => number;
  y: (lat: number) => number;
}

export function makeProjection(
  stations: Station[],
  width: number,
  height: number,
  padding = 40
): Projection {
  // Derive the network's bounding box from its stations, with a small
  // geographic margin so termini don't sit at the very edge.
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const s of stations) {
    if (s.lat < minLat) minLat = s.lat;
    if (s.lat > maxLat) maxLat = s.lat;
    if (s.lng < minLng) minLng = s.lng;
    if (s.lng > maxLng) maxLng = s.lng;
  }
  const latPad = (maxLat - minLat) * 0.03;
  const lngPad = (maxLng - minLng) * 0.03;
  minLat -= latPad; maxLat += latPad;
  minLng -= lngPad; maxLng += lngPad;
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  // Correct for latitude distortion so the map isn't stretched.
  const midLat = (minLat + maxLat) / 2;
  const lngScaleFactor = Math.cos((midLat * Math.PI) / 180);

  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const scaleX = usableW / (lngRange * lngScaleFactor);
  const scaleY = usableH / latRange;
  const scale = Math.min(scaleX, scaleY);

  const contentW = lngRange * lngScaleFactor * scale;
  const contentH = latRange * scale;
  const offsetX = padding + (usableW - contentW) / 2;
  const offsetY = padding + (usableH - contentH) / 2;

  return {
    x: (lng: number) => offsetX + (lng - minLng) * lngScaleFactor * scale,
    // Latitude increases northward; SVG y increases downward, so flip.
    y: (lat: number) => offsetY + (maxLat - lat) * scale,
  };
}
