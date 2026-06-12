import { roundHalfEven } from "./round";

// Port of PollenAtlas/Services/RiskGeometry.cs — §9 wind-directional affected area.
// Meteorological wind direction is where the wind blows FROM, so the pollen plume travels
// to the opposite bearing. The affected area is a downwind sector: radius grows with wind
// speed (carries pollen further) and half-angle narrows (a strong steady wind is more
// directional; near-calm spreads omnidirectionally).

const EARTH_RADIUS_KM = 6371.0;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Bearing the plume travels toward, given the meteorological "wind from" degrees. */
export function plumeBearing(windFromDeg: number): number {
  return ((windFromDeg % 360) + 360 + 180) % 360;
}

/** Affected radius: 5 km base + 4 km per m/s of wind, capped at 60 km. */
export function radiusKm(windSpeedMs: number | null): number {
  const v = windSpeedMs ?? 0;
  return roundHalfEven(clamp(5 + v * 4, 5, 60), 1);
}

/** Sector half-angle: near-calm (≤0.5 m/s) is omnidirectional (180°); otherwise it
 *  narrows with wind speed from 60° down to a floor of 20°. */
export function halfAngleDeg(windSpeedMs: number | null): number {
  const v = windSpeedMs ?? 0;
  return v <= 0.5 ? 180 : roundHalfEven(clamp(60 - v * 5, 20, 60), 0);
}

/** Forward geodesic: destination from (lat,lng) along bearing for distanceKm (great-circle). */
export function destination(
  lat: number, lng: number, bearingDeg: number, distanceKm: number,
): [number, number] {
  const br = rad(bearingDeg);
  const lat1 = rad(lat);
  const lng1 = rad(lng);
  const dr = distanceKm / EARTH_RADIUS_KM;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(br));
  const lng2 = lng1 + Math.atan2(
    Math.sin(br) * Math.sin(dr) * Math.cos(lat1),
    Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2),
  );
  return [deg(lat2), deg(lng2)];
}

/** Polygon approximating the affected sector as [lat,lng] points: the origin apex plus
 *  an arc across the downwind sector. A 180° (calm) sector becomes a full ring (no apex). */
export function sectorPolygon(
  lat: number, lng: number, bearingDeg: number,
  halfAngle: number, radius: number, steps = 16,
): [number, number][] {
  const pts: [number, number][] = [];
  const full = halfAngle >= 180;
  if (!full) pts.push([lat, lng]); // wedge apex at the origin
  const start = bearingDeg - halfAngle;
  const end = bearingDeg + halfAngle;
  for (let i = 0; i <= steps; i++) {
    const b = start + ((end - start) * i) / steps;
    pts.push(destination(lat, lng, b, radius));
  }
  return pts;
}
