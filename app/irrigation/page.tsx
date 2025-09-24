"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useFetch } from "@hooks/useFetch";

function generateSchedule(
  crop: string,
  moisturePercent: number | null,
  hourlyTemps: number[]
) {
  const avgTemp = hourlyTemps.length
    ? hourlyTemps.reduce((a, b) => a + b, 0) / hourlyTemps.length
    : 20;
  // Simple heuristic: base need + temp adjustment - soil moisture
  const base =
    crop.toLowerCase() === "rice" ? 8 : crop.toLowerCase() === "corn" ? 6 : 4;
  const tempAdj = Math.max(0, Math.round((avgTemp - 18) / 5));
  const moistureAdj =
    moisturePercent != null ? Math.round(moisturePercent / 20) : 2;
  const daysPerIrrigation = Math.max(1, base + tempAdj - moistureAdj);
  return {
    avgTemp: Math.round(avgTemp * 10) / 10,
    daysPerIrrigation,
    notes: "Heuristic schedule. Calibrate with local evapotranspiration data.",
  };
}

export default function IrrigationPage() {
  const { user, isAuthenticated } = useAuth();
  const farmId = user?.uid || "demo";
  const latitude = 37.7749;
  const longitude = -122.4194;

  const { data: weather } = useFetch<any>("/api/weather", {
    params: { farmId, latitude, longitude },
    skip: !isAuthenticated,
  });
  const { data: agro } = useFetch<any>("/api/agro", {
    params: { farmId, latitude, longitude },
    skip: !isAuthenticated,
  });

  const [crop, setCrop] = useState("Corn");

  const schedule = useMemo(() => {
    const temps = weather?.hourly?.temperature_2m || [];
    const moisture = agro?.moisturePercent ?? null;
    return generateSchedule(crop, moisture, temps);
  }, [crop, weather, agro]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">Irrigation Scheduler</h1>
      {!isAuthenticated && (
        <p className="text-sm text-gray-600">
          Sign in to generate irrigation schedules.
        </p>
      )}
      <div className="rounded border p-3">
        <div className="mb-2 flex items-center gap-2">
          <label className="text-sm">Crop</label>
          <select
            className="rounded border p-1 text-sm"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          >
            <option>Corn</option>
            <option>Wheat</option>
            <option>Rice</option>
            <option>Soybean</option>
            <option>Barley</option>
            <option>Sorghum</option>
          </select>
        </div>
        <div className="text-sm">
          <p>Average temperature: {schedule.avgTemp} °C</p>
          <p>Soil moisture: {agro?.moisturePercent ?? "-"}%</p>
          <p>Water every {schedule.daysPerIrrigation} day(s)</p>
          <p className="text-xs text-gray-500 mt-1">{schedule.notes}</p>
        </div>
      </div>
    </div>
  );
}
