"use client";
import { useState } from "react";
import { useAuth } from "@hooks/useAuth";
import Map from "@components/Map";
import { useFarm } from "@/contexts/FarmContext";
import { usePolygonData } from "@/hooks/usePolygonData";

export default function AgroPage() {
  const { user, isAuthenticated } = useAuth();
  const { farmId, location, geoError } = useFarm();
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const latitude = location?.latitude ?? 37.7749;
  const longitude = location?.longitude ?? -122.4194;

  const { polygon, agro, loading, error } = usePolygonData({
    farmId: user?.uid || "demo",
    latitude,
    longitude,
    enabled: isAuthenticated && !!location,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold">Agro Monitoring</h1>
      {!isAuthenticated && (
        <p className="text-sm text-gray-600">Sign in to view your fields.</p>
      )}
      {geoError && <p className="text-sm text-red-600">{geoError}</p>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2 rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm text-gray-700">Satellite view</div>
          <Map
            height={420}
            polygons={
              polygon.length
                ? [
                    {
                      id: "field-1",
                      points: polygon,
                      color: "#f59e0b", // amber-500 for contrast
                      label: "Field boundary",
                    },
                  ]
                : []
            }
            tileProvider="esri"
            onPolygonClick={(id) => setSelected(id)}
          />
          <p className="mt-2 text-xs text-gray-600">
            Click the highlighted field to view detailed insights.
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
          <div className="mb-2 font-medium">Field Insights</div>
          {!isAuthenticated && <div>Not signed in.</div>}
          {error && <div className="text-red-600">{error}</div>}
          {loading && <div>Loading field data...</div>}
          {isAuthenticated && selected && (
            <div className="space-y-2">
              <div>Soil moisture: {agro?.moisturePercent ?? "-"}%</div>
              <div>Surface temp: {agro?.surfaceTempC ?? "-"} °C</div>
              <div>
                NDVI: {agro?.ndvi?.value ?? "-"}
                {agro?.ndvi?.date
                  ? ` (as of ${new Date(
                      agro.ndvi.date * 1000
                    ).toLocaleDateString()})`
                  : ""}
              </div>
              <div className="text-xs text-gray-500">
                Data reflects conditions within ~1 km radius.
              </div>
            </div>
          )}
          {isAuthenticated && !selected && (
            <div className="text-gray-600">
              Select a field polygon on the map.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
