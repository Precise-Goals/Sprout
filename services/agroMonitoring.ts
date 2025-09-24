export type LatLng = { latitude: number; longitude: number };
export type FarmPolygon = Array<LatLng>;

const AGRO_API = "/api/agro"; // server route already proxies soil & ndvi
const WEATHER_API = "/api/weather";
const SOIL_API = "/api/soil";
const CROPS_API = "/api/crops";

export async function fetchAgro(params: {
  farmId: string;
  latitude: number;
  longitude: number;
  polyId?: string;
}) {
  const q = new URLSearchParams({
    farmId: params.farmId,
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    ...(params.polyId ? { polyId: params.polyId } : {}),
  }).toString();
  const res = await fetch(`${AGRO_API}?${q}`);
  if (!res.ok) throw new Error("Failed to fetch agro");
  return res.json();
}

export async function fetchWeather(params: {
  farmId: string;
  latitude: number;
  longitude: number;
}) {
  const q = new URLSearchParams({
    farmId: params.farmId,
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  }).toString();
  const res = await fetch(`${WEATHER_API}?${q}`);
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

export async function fetchSoil(params: {
  farmId: string;
  latitude: number;
  longitude: number;
}) {
  const q = new URLSearchParams({
    farmId: params.farmId,
    latitude: String(params.latitude),
    longitude: String(params.longitude),
  }).toString();
  const res = await fetch(`${SOIL_API}?${q}`);
  if (!res.ok) throw new Error("Failed to fetch soil");
  return res.json();
}

export async function fetchCropRecs(params: {
  farmId: string;
  latitude: number;
  longitude: number;
  waterAvailability?: "low" | "medium" | "high";
  history?: Array<{ crop: string; year?: number }>;
  maxCostIndex?: number;
  avgTemp?: number;
}) {
  const res = await fetch(CROPS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      farmId: params.farmId,
      location: {
        latitude: params.latitude,
        longitude: params.longitude,
      },
      waterAvailability: params.waterAvailability,
      history: params.history || [],
      affordability: { maxCostIndex: params.maxCostIndex ?? 3 },
      avgTemp: params.avgTemp,
    }),
  });
  if (!res.ok) throw new Error("Failed to fetch crop recommendations");
  return res.json();
}

// Utility to create a rough circle polygon (~1km radius) around a center
export function createCirclePolygon(
  center: LatLng,
  radiusMeters = 1000,
  numPoints = 48
) {
  const R = 6371000; // Earth radius
  const d = radiusMeters / R;
  const lat = (center.latitude * Math.PI) / 180;
  const lon = (center.longitude * Math.PI) / 180;
  const points = [] as Array<{ latitude: number; longitude: number }>;
  for (let i = 0; i < numPoints; i++) {
    const brng = (2 * Math.PI * i) / numPoints;
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brng)
    );
    const lon2 =
      lon +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(lat),
        Math.cos(d) - Math.sin(lat) * Math.sin(lat2)
      );
    points.push({
      latitude: (lat2 * 180) / Math.PI,
      longitude: (lon2 * 180) / Math.PI,
    });
  }
  return points;
}

export function getFarmPolygon(
  center: LatLng,
  radiusMeters = 1000,
  numPoints = 48
): FarmPolygon {
  return createCirclePolygon(center, radiusMeters, numPoints);
}
