"use client";
import { useMemo } from "react";

type WeatherData = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation?: number[];
  };
};

type SoilData = {
  texture?: string | null; // sand, loam, clay
  organicMatter?: number | null;
  ph?: number | null;
};

type Props = {
  crop: string;
  weather?: WeatherData;
  soil?: SoilData;
  className?: string;
};

function average(arr: number[] = []): number | null {
  const f = arr.filter((n) => Number.isFinite(n));
  if (!f.length) return null;
  return f.reduce((a, b) => a + b, 0) / f.length;
}

function sum(arr: number[] = []): number {
  return arr.filter((n) => Number.isFinite(n)).reduce((a, b) => a + b, 0);
}

function kcForCrop(crop: string): number {
  const map: Record<string, number> = {
    corn: 1.1,
    maize: 1.1,
    wheat: 1.0,
    rice: 1.05,
    soybean: 1.05,
    barley: 0.95,
    default: 0.95,
  };
  return map[crop.toLowerCase()] ?? map.default;
}

function rootingDepthForCrop(crop: string): number {
  const map: Record<string, number> = {
    corn: 0.6,
    maize: 0.6,
    wheat: 0.5,
    rice: 0.4,
    soybean: 0.5,
    barley: 0.5,
    default: 0.5,
  };
  return map[crop.toLowerCase()] ?? map.default; // meters
}

function tawByTexture(texture?: string | null): number {
  const t = (texture || "").toLowerCase();
  if (t.includes("sand")) return 80; // mm/m
  if (t.includes("clay")) return 140; // mm/m
  return 120; // loam-ish, mm/m
}

export default function IrrigationCard({
  crop,
  weather,
  soil,
  className,
}: Props) {
  const temps = weather?.hourly?.temperature_2m || [];
  const rains = weather?.hourly?.precipitation || [];

  const avgTemp = useMemo(() => average(temps), [temps]);
  const recentRain = useMemo(() => sum(rains.slice(-72)), [rains]); // last 3 days (hourly)

  // Minimal ET0 heuristic (mm/day): proportional to temperature
  const et0 = useMemo(() => {
    if (avgTemp == null) return 4; // fallback typical
    // simple linear rule of thumb
    return Math.max(2, Math.min(8, 0.1 * (avgTemp + 10)));
  }, [avgTemp]);

  const kc = useMemo(() => kcForCrop(crop), [crop]);
  const rd = useMemo(() => rootingDepthForCrop(crop), [crop]);
  const taw = useMemo(() => tawByTexture(soil?.texture), [soil?.texture]); // total available water per m
  const raw = useMemo(() => 0.5 * taw * rd, [taw, rd]); // readily available water (mm)

  const etc = useMemo(() => et0 * kc, [et0, kc]); // crop evapotranspiration mm/day

  // Application depth per event: fraction of RAW
  const depthPerEvent = useMemo(
    () => Math.round(Math.max(10, Math.min(40, raw * 0.6))),
    [raw]
  ); // mm

  // Net irrigation requirement per week
  const weeklyEt = useMemo(() => etc * 7, [etc]);
  const effectiveRain = useMemo(
    () => Math.max(0, recentRain * 0.8),
    [recentRain]
  );
  const weeklyNeed = useMemo(
    () => Math.max(0, Math.round(weeklyEt - effectiveRain)),
    [weeklyEt, effectiveRain]
  );
  const eventsPerWeek = useMemo(
    () => Math.max(1, Math.round(weeklyNeed / depthPerEvent) || 1),
    [weeklyNeed, depthPerEvent]
  );

  // Next irrigation in days
  const daysToDepletion = useMemo(
    () => Math.max(1, Math.round(raw / Math.max(1, etc))),
    [raw, etc]
  );

  const nextDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + daysToDepletion);
    return d.toLocaleDateString();
  }, [daysToDepletion]);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        className || ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Irrigation schedule
          </h3>
          <p className="text-sm text-gray-600">Crop: {crop}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>ET₀ ~ {et0.toFixed(1)} mm/d</div>
          <div>
            Kc {kc.toFixed(2)} • ETc ~ {etc.toFixed(1)} mm/d
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-800">
        <div className="rounded-md border border-gray-200 p-2">
          <div className="font-medium">Events/week</div>
          <div className="text-sm">{eventsPerWeek}</div>
        </div>
        <div className="rounded-md border border-gray-200 p-2">
          <div className="font-medium">Depth/event</div>
          <div className="text-sm">{depthPerEvent} mm</div>
        </div>
        <div className="rounded-md border border-gray-200 p-2">
          <div className="font-medium">Next irrigation</div>
          <div className="text-sm">
            in {daysToDepletion} d • {nextDate}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-gray-500">
        <div>
          Soil: {soil?.texture || "unknown"} • RAW ~ {Math.round(raw)} mm
        </div>
        {avgTemp != null && (
          <div>
            Avg temp ~ {avgTemp.toFixed(1)}°C • Recent rain ~{" "}
            {recentRain.toFixed(1)} mm
          </div>
        )}
      </div>
    </div>
  );
}
