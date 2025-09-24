"use client";
import { useEffect, useMemo, useState } from "react";
import {
  createCirclePolygon,
  fetchAgro,
  fetchSoil,
  fetchWeather,
  fetchCropRecs,
} from "@/services/agroMonitoring";

export function usePolygonData(params: {
  farmId: string;
  latitude?: number;
  longitude?: number;
  enabled?: boolean;
}) {
  const { farmId, latitude, longitude, enabled = true } = params;
  const [agro, setAgro] = useState<any>(null);
  const [soil, setSoil] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const polygon = useMemo(() => {
    if (latitude == null || longitude == null)
      return [] as Array<{ latitude: number; longitude: number }>;
    return createCirclePolygon({ latitude, longitude }, 1000, 48);
  }, [latitude, longitude]);

  useEffect(() => {
    let active = true;
    if (!enabled || latitude == null || longitude == null) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [agroData, soilData, weatherData] = await Promise.all([
          fetchAgro({ farmId, latitude, longitude }).catch(() => null),
          fetchSoil({ farmId, latitude, longitude }).catch(() => null),
          fetchWeather({ farmId, latitude, longitude }).catch(() => null),
        ]);
        if (!active) return;
        setAgro(agroData);
        setSoil(soilData);
        setWeather(weatherData);

        const temps: number[] = weatherData?.hourly?.temperature_2m || [];
        const avgTemp = temps.length
          ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length
          : undefined;
        const recs = await fetchCropRecs({
          farmId,
          latitude,
          longitude,
          waterAvailability: soilData?.texture === "sand" ? "low" : "medium",
          history: [],
          maxCostIndex: 3,
          avgTemp,
        }).catch(() => ({ recommendations: [] }));
        if (!active) return;
        setCrops(recs?.recommendations || []);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "Failed to load polygon data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, farmId, latitude, longitude]);

  return { polygon, agro, soil, weather, crops, loading, error } as const;
}
