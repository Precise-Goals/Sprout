"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useFetch } from "@hooks/useFetch";

export default function AgroPage() {
  const { user, isAuthenticated } = useAuth();
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!navigator?.geolocation) {
      setGeoError("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoError(null);
      },
      () => setGeoError("Permission denied or unable to get location.")
    );
  }, [isAuthenticated]);

  const farmId = user?.uid || "demo";

  const { data, loading, error, refetch } = useFetch<any>(
    coords ? "/api/agro" : null,
    {
      params: coords
        ? {
            farmId,
            latitude: coords.lat,
            longitude: coords.lon,
            store: true,
          }
        : undefined,
      skip: !isAuthenticated || !coords,
    }
  );

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-semibold">Agro-monitoring</h1>
      {!isAuthenticated && (
        <p className="text-sm text-gray-600">Sign in to view your farm area.</p>
      )}
      {geoError && <p className="text-sm text-red-600">{geoError}</p>}
      <div className="rounded border p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {coords
              ? `Center: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(
                  4
                )} (1 km radius)`
              : "Awaiting location..."}
          </div>
          <button
            className="rounded border px-3 py-1 text-sm"
            onClick={refetch}
          >
            Refresh
          </button>
        </div>
        {loading && <p className="text-sm">Loading agro data...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {data && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded border p-3">
              <h2 className="mb-2 font-medium">Soil & Vegetation</h2>
              <ul className="text-sm">
                <li>Moisture: {data.moisturePercent ?? "-"}%</li>
                <li>Surface Temp: {data.surfaceTempC ?? "-"} °C</li>
                <li>
                  NDVI: {data.ndvi?.value ?? "-"}{" "}
                  {data.ndvi?.date
                    ? `(as of ${new Date(
                        data.ndvi.date * 1000
                      ).toLocaleDateString()})`
                    : ""}
                </li>
              </ul>
            </div>
            <div className="rounded border p-3">
              <h2 className="mb-2 font-medium">Area Summary</h2>
              <p className="text-sm text-gray-700">
                Using a 1 km radius around your location to derive field-level
                conditions.
              </p>
              <p className="text-xs text-gray-500">Provider: {data.provider}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
