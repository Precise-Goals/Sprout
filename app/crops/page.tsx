"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useFetch } from "@hooks/useFetch";

export default function CropsPage() {
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<Array<{ crop: string; year: number }>>(
    [{ crop: "Corn", year: new Date().getFullYear() - 1 }]
  );

  const farmId = user?.uid || "demo";
  const latitude = 37.7749;
  const longitude = -122.4194;

  const { data: soil } = useFetch<any>("/api/soil", {
    params: { farmId, latitude, longitude },
    skip: !isAuthenticated,
  });
  const { data: weather } = useFetch<any>("/api/weather", {
    params: { farmId, latitude, longitude },
    skip: !isAuthenticated,
  });

  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const avgTemp = (() => {
      const arr = weather?.hourly?.temperature_2m || [];
      if (!arr.length) return undefined;
      return arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
    })();
    (async () => {
      try {
        const res = await fetch("/api/crops", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            farmId,
            location: { latitude, longitude },
            waterAvailability: soil?.texture === "sand" ? "low" : "medium",
            history,
            affordability: { maxCostIndex: 3 },
            avgTemp,
          }),
        });
        const json = await res.json();
        setRecs(json?.recommendations || []);
      } catch {
        setRecs([]);
      }
    })();
  }, [isAuthenticated, soil, weather, farmId, latitude, longitude, history]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-semibold">Crop Recommender</h1>
      {!isAuthenticated && (
        <p className="text-sm text-gray-600">
          Sign in to get crop recommendations.
        </p>
      )}
      <div className="rounded border p-3">
        <h2 className="mb-2 font-medium">Recommendations</h2>
        {!recs.length ? (
          <p className="text-sm text-gray-600">No recommendations yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {recs.map((r) => (
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
    </div>
  );
}
