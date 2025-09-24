import { NextResponse } from "next/server";
import { db } from "@lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const AGRO_API_KEY = "1f9443d673c488b00d799929541430bc";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const polyId = searchParams.get("polyId"); // optional polygon id for NDVI
    const store =
      (searchParams.get("store") || "true").toLowerCase() !== "false";

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "latitude and longitude are required" },
        { status: 400 }
      );
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    // 1) Soil endpoint (includes soil moisture) — Agromonitoring
    const soilUrl = `https://api.agromonitoring.com/agro/1.0/soil?lat=${lat}&lon=${lon}&appid=${AGRO_API_KEY}`;
    const soilRes = await fetch(soilUrl, { next: { revalidate: 6 * 60 * 60 } });
    if (!soilRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch soil data" },
        { status: 502 }
      );
    }
    const soilJson = await soilRes.json();

    // 2) NDVI (optional, requires polygon). If polyId absent, skip gracefully
    let ndvi: { date?: number; value?: number } | null = null;
    if (polyId) {
      const end = Math.floor(Date.now() / 1000);
      const start = end - 30 * 24 * 60 * 60; // last 30 days
      const ndviUrl = `https://api.agromonitoring.com/agro/1.0/ndvi/history?polyid=${encodeURIComponent(
        polyId
      )}&start=${start}&end=${end}&appid=${AGRO_API_KEY}`;
      const ndviRes = await fetch(ndviUrl, {
        next: { revalidate: 6 * 60 * 60 },
      });
      if (ndviRes.ok) {
        const arr = (await ndviRes.json()) as Array<{
          dt?: number;
          data?: { mean?: number };
        }>; // shape varies
        if (Array.isArray(arr) && arr.length) {
          const latest = arr[arr.length - 1];
          const value = latest?.data?.mean;
          ndvi = {
            date: latest?.dt,
            value:
              typeof value === "number" ? Number(value.toFixed(3)) : undefined,
          };
        }
      }
    }

    const moisture =
      typeof soilJson?.moisture === "number"
        ? Number((soilJson.moisture * 100).toFixed(2))
        : null; // convert m3/m3 -> %
    const t0 = soilJson?.t0 ?? null; // surface temp K
    const t10 = soilJson?.t10 ?? null;
    const tmin =
      typeof t0 === "number" ? Number((t0 - 273.15).toFixed(1)) : null;

    const cropHealth = {
      latitude: lat,
      longitude: lon,
      fetchedAt: new Date().toISOString(),
      moisturePercent: moisture,
      surfaceTempC: tmin,
      ndvi,
      provider: "agromonitoring",
      sources: { soil: soilUrl, ndvi: polyId ? "ndvi-history" : null },
    } as const;

    if (farmId && store) {
      await setDoc(
        doc(db, "agroData", farmId),
        { farmId, last: cropHealth },
        { merge: true }
      );
    }

    return NextResponse.json(cropHealth);
  } catch (e) {
    const message = (e as { message?: string })?.message || "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
