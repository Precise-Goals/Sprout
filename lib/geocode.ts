export type PlaceSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
};

// Lightweight geocoding/autocomplete using Nominatim (OpenStreetMap)
// Note: For production, consider a provider with API keys and usage policies.
export async function fetchPlaceSuggestions(
  query: string
): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=0&limit=5`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en" },
    // Be polite with a short cache to reduce churn
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;
  return json
    .slice(0, 5)
    .map((p) => ({
      label: p.display_name || "Unknown",
      latitude: Number(p.lat || 0),
      longitude: Number(p.lon || 0),
    }))
    .filter((p) => isFinite(p.latitude) && isFinite(p.longitude));
}
