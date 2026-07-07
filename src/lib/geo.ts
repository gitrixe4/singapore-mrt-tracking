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

// Bounding box of Singapore MRT/LRT network, used to project lat/lng to SVG space.
export const SG_BOUNDS = {
  minLat: 1.245,
  maxLat: 1.452,
  minLng: 103.605,
  maxLng: 103.975,
};

export interface Projection {
  x: (lng: number) => number;
  y: (lat: number) => number;
}

export function makeProjection(
  width: number,
  height: number,
  padding = 40
): Projection {
  const { minLat, maxLat, minLng, maxLng } = SG_BOUNDS;
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
