"use client";
import { useMemo } from "react";

type WeatherData = {
  hourly?: { time?: string[]; temperature_2m?: number[] };
};

type SoilData = {
  ph?: number | null;
  organicMatter?: number | null; // %
  texture?: string | null;
};

type Props = {
  crop: string;
  weather?: WeatherData;
  soil?: SoilData;
  plantingWindowStart?: string; // ISO date
  className?: string;
};

function average(numbers: number[] = []): number | null {
  const filtered = numbers.filter((n) => Number.isFinite(n));
  if (!filtered.length) return null;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function format(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function estimateDaysToMaturity(
  crop: string,
  avgTemp: number | null,
  soil?: SoilData
): number {
  const baseByCrop: Record<string, number> = {
    corn: 110,
    maize: 110,
    wheat: 120,
    rice: 135,
    soybean: 105,
    barley: 95,
  };
  let days = baseByCrop[crop.toLowerCase()] ?? 100;

  if (avgTemp != null) {
    if (avgTemp >= 18 && avgTemp <= 25) days *= 0.9;
    else if (avgTemp < 10) days *= 1.2;
    else if (avgTemp > 30) days *= 1.1;
  }

  if (soil) {
    if (soil.organicMatter != null && soil.organicMatter > 4) days *= 0.95;
    if (soil.ph != null && (soil.ph < 5.5 || soil.ph > 7.5)) days *= 1.05;
  }

  return Math.max(60, Math.round(days));
}

function buildCalendarTicks(
  start: Date,
  end: Date
): { label: string; left: string }[] {
  const ticks: { label: string; left: string }[] = [];
  const total = end.getTime() - start.getTime();
  if (total <= 0) return ticks;
  const temp = new Date(start);
  temp.setDate(1);
  temp.setMonth(temp.getMonth() + 1);
  temp.setHours(0, 0, 0, 0);
  while (temp < end) {
    const left = ((temp.getTime() - start.getTime()) / total) * 100;
    ticks.push({
      label: temp.toLocaleDateString(undefined, { month: "short" }),
      left: `${left}%`,
    });
    temp.setMonth(temp.getMonth() + 1);
  }
  return ticks;
}

export default function CropCycleCard({
  crop,
  weather,
  soil,
  plantingWindowStart,
  className,
}: Props) {
  const avgTemp = useMemo(
    () => average(weather?.hourly?.temperature_2m || []),
    [weather]
  );
  const start = useMemo(
    () => new Date(plantingWindowStart || new Date()),
    [plantingWindowStart]
  );
  const days = useMemo(
    () => estimateDaysToMaturity(crop, avgTemp, soil),
    [crop, avgTemp, soil]
  );
  const end = useMemo(() => addDays(start, days), [start, days]);
  const ticks = useMemo(() => buildCalendarTicks(start, end), [start, end]);

  const rangePercent = 100; // full width

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${
        className || ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {crop} cycle
          </h3>
          <p className="text-sm text-gray-600">
            {format(start)} → {format(end)} • ~{days} days
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          {avgTemp != null ? (
            <span>Avg temp {avgTemp.toFixed(1)}°C</span>
          ) : (
            <span>Temp unavailable</span>
          )}
          {soil?.ph != null && <div>pH {soil.ph}</div>}
        </div>
      </div>

      <div className="mt-4">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"
            style={{ width: `${rangePercent}%` }}
          />
        </div>
        <div className="relative mt-3 h-6">
          <div className="absolute -top-2 text-xs text-gray-700">
            {format(start)}
          </div>
          <div className="absolute right-0 -top-2 text-xs text-gray-700">
            {format(end)}
          </div>
          {ticks.map((t, i) => (
            <div
              key={i}
              className="absolute -top-1 text-[10px] text-gray-500"
              style={{ left: t.left }}
            >
              |<div className="mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-700">
        <div className="rounded-md border border-gray-200 p-2">
          <div className="font-medium">Planting</div>
          <div>{format(start)}</div>
        </div>
        <div className="rounded-md border border-gray-200 p-2">
          <div className="font-medium">Mid-season</div>
          <div>{format(addDays(start, Math.round(days / 2)))}</div>
        </div>
        <div className="rounded-md border border-gray-200 p-2">
          <div className="font-medium">Harvest</div>
          <div>{format(end)}</div>
        </div>
      </div>
    </div>
  );
}
