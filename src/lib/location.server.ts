// Smart Location & Service Area — 100% free stack, no API key:
// OpenStreetMap Nominatim (geocoding) + OSRM (routing). Server-side only.

export const SERVICE_AREA = {
  name: "Västerås",
  lat: 59.6099,
  lng: 16.5448,
  radiusKm: 40,
};

const UA = "VVSFlow/1.0 (Ekström VVS booking; contact via site)";

export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function distanceFromBaseKm(lat: number, lng: number) {
  return haversineKm(SERVICE_AREA.lat, SERVICE_AREA.lng, lat, lng);
}

export function isInsideServiceArea(lat: number, lng: number) {
  return distanceFromBaseKm(lat, lng) <= SERVICE_AREA.radiusKm;
}

export async function searchAddresses(query: string): Promise<GeoResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=se&viewbox=${SERVICE_AREA.lng - 1},${SERVICE_AREA.lat + 1},${SERVICE_AREA.lng + 1},${SERVICE_AREA.lat - 1}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "sv,en" } });
  if (!res.ok) throw new Error(`Address search failed [${res.status}]`);
  const rows = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "sv,en" } });
  if (!res.ok) throw new Error(`Reverse geocoding failed [${res.status}]`);
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Driving time in minutes from the VVS base to the job, via free OSRM.
export async function driveMinutesFromBase(lat: number, lng: number): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${SERVICE_AREA.lng},${SERVICE_AREA.lat};${lng},${lat}?overview=false`;
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const data = (await res.json()) as { routes?: Array<{ duration: number }> };
    const seconds = data.routes?.[0]?.duration;
    return seconds == null ? null : Math.round(seconds / 60);
  } catch {
    return null;
  }
}

// OSRM table: one request returns drive minutes between every pair of points.
// Returns null when the routing service is unreachable (caller must NOT treat slots as valid).
export async function osrmMatrix(points: { lat: number; lng: number }[]): Promise<(number | null)[][] | null> {
  if (points.length < 2) return [[0]];
  try {
    const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
    const res = await fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=duration`, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const data = (await res.json()) as { code?: string; durations?: (number | null)[][] };
    if (data.code !== "Ok" || !data.durations) return null;
    return data.durations.map((row) => row.map((s) => (s == null ? null : Math.ceil(s / 60))));
  } catch {
    return null;
  }
}
