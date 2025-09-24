"use client";
import { useAuth } from "@hooks/useAuth";
import AuthForm from "@components/AuthForm";
import Map from "@components/Map";
import { useFarm } from "@/contexts/FarmContext";
import { useMemo, useState } from "react";
import PlaceAutocomplete from "@components/PlaceAutocomplete";
import { PlaceSuggestion } from "@/lib/geocode";
import { usePolygonData } from "@/hooks/usePolygonData";

type Farmer = {
  name?: string;
  farmName?: string;
  location?: { latitude?: number; longitude?: number };
  email?: string;
};

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { farmId, location, geoError } = useFarm();
  const { setLocation, placeLabel, setPlaceLabel } = useFarm();
  const [selectedPolygonId, setSelectedPolygonId] = useState<
    string | undefined
  >(undefined);

  const latitude = location?.latitude ?? 37.7749;
  const longitude = location?.longitude ?? -122.4194;

  const { polygon, agro, soil, weather, crops, loading, error } =
    usePolygonData({
      farmId,
      latitude,
      longitude,
      enabled: isAuthenticated && !!location,
    });

  const irrigation = useMemo(() => {
    const temps: number[] = weather?.hourly?.temperature_2m || [];
    const avgTemp = temps.length
      ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10
      : null;
    const moisture = agro?.moisturePercent ?? null;
    if (avgTemp == null)
      return {
        avgTemp: null,
        daysPerIrrigation: null,
        notes: "No weather data",
      };
    const base = 5;
    const tempAdj = Math.max(0, Math.round((avgTemp - 18) / 5));
    const moistureAdj = moisture != null ? Math.round(moisture / 20) : 2;
    const days = Math.max(1, base + tempAdj - moistureAdj);
    return {
      avgTemp,
      daysPerIrrigation: days,
      notes: "Heuristic schedule; calibrate with local ET data.",
    };
  }, [weather, agro]);
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {!isAuthenticated ? (
        <div className="mx-auto max-w-md">
          <h1 className="mb-4 text-xl font-semibold">Sprout</h1>
          <AuthForm />
          <p className="mt-4 text-sm text-gray-500">
            Demo account: test@admin.com / testadmin
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-lg font-semibold text-gray-900">
            Welcome, {user?.email || "Farmer"}
          </div>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="col-span-2 rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-3 grid grid-cols-[1fr_auto] items-center gap-2">
                <PlaceAutocomplete
                  value={placeLabel || ""}
                  onChange={(v) => setPlaceLabel(v)}
                  onSelect={(p: PlaceSuggestion) => {
                    setPlaceLabel(p.label);
                    setLocation({
                      latitude: p.latitude,
                      longitude: p.longitude,
                    });
                  }}
                  onLocate={() => {
                    if (!navigator?.geolocation) return;
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLocation({
                          latitude: pos.coords.latitude,
                          longitude: pos.coords.longitude,
                        });
                        setPlaceLabel("My location");
                      },
                      () => {
                        /* ignore */
                      }
                    );
                  }}
                />
              </div>
              <h2 className="mb-2 font-medium">Farm Map</h2>
              {geoError && (
                <p className="mb-2 text-sm text-red-600">{geoError}</p>
              )}
              <Map
                height={320}
                markers={
                  location
                    ? [
                        {
                          latitude,
                          longitude,
                          label: placeLabel || "Farm center",
                        },
                      ]
                    : []
                }
                polygons={
                  polygon.length
                    ? [
                        {
                          id: "farm-1",
                          points: polygon,
                          color: "#10b981",
                          label: "Farm area",
                        },
                      ]
                    : []
                }
                tileProvider="esri"
                terrainOverlay={false}
                onPolygonClick={(id) => setSelectedPolygonId(id)}
              />
              <p className="mt-2 text-xs text-gray-600">
                Satellite imagery with farm boundary overlay.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
              <div className="font-medium text-gray-900">Area Summary</div>
              <div className="mt-2 text-gray-700 space-y-1">
                <div>Farm: My Farm</div>
                <div>Location: {placeLabel || "Unknown"}</div>
                <div>Farmer: {user?.email || "N/A"}</div>
                {loading && <div>Loading field data...</div>}
                {error && <div className="text-red-600">{error}</div>}
                {agro && (
                  <>
                    <div>Soil moisture: {agro.moisturePercent ?? "-"}%</div>
                    <div>Surface temp: {agro.surfaceTempC ?? "-"} °C</div>
                    <div>
                      NDVI: {agro.ndvi?.value ?? "-"}
                      {agro.ndvi?.date
                        ? ` (as of ${new Date(
                            agro.ndvi.date * 1000
                          ).toLocaleDateString()})`
                        : ""}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-medium">Irrigation Schedule</h2>
              <div className="text-sm">
                <div>Average temperature: {irrigation.avgTemp ?? "-"} °C</div>
                <div>
                  Water every {irrigation.daysPerIrrigation ?? "-"} day(s)
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {irrigation.notes}
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-medium">Soil & Crop Insights</h2>
              <div className="text-sm text-gray-700">
                Insights are derived from soil moisture, temperature, and NDVI
                signals within the selected field.
              </div>
              <div className="mt-3">
                <div className="mb-1 font-medium">Top Crop Recommendations</div>
                {!crops?.length ? (
                  <div className="text-sm text-gray-600">
                    No recommendations yet.
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {crops.map((r) => (
                      <li key={r.key} className="rounded border p-2 text-sm">
                        <div className="font-medium">{r.crop}</div>
                        <div>Score: {r.score}</div>
                        <div className="text-xs text-gray-600">
                          Water: {r.hints?.water}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedPolygonId && (
                <div className="mt-4 rounded-md border p-3 text-sm">
                  <div className="mb-1 font-medium">Field Insights</div>
                  <div>Area: ~3.1 km² (approx. 1 km radius)</div>
                  <div>Vegetation index (NDVI): {agro?.ndvi?.value ?? "-"}</div>
                  <div>
                    Crop suitability based on current conditions shown above.
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
