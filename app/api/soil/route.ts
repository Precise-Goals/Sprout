import { NextResponse } from "next/server";
import { db } from "@lib/firebase";
import { doc, setDoc } from "firebase/firestore";

function classifyTexture(sand: number, silt: number, clay: number): string {
  if (clay >= 40) return "clay";
  if (sand >= 70) return "sand";
  if (silt >= 80) return "silt";
  if (sand >= 43 && sand <= 85 && clay >= 7 && clay <= 20) return "sandy loam";
  if (clay >= 20 && clay <= 35 && sand <= 45) return "clay loam";
  return "loam";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get("farmId");
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");

    if (!farmId || !latitude || !longitude) {
      return NextResponse.json(
        { error: "farmId, latitude and longitude are required" },
        { status: 400 }
      );
    }

    const url = `https://rest.soilgrids.org/soilgrids/v2.0/properties/query?lat=${encodeURIComponent(
      latitude
    )}&lon=${encodeURIComponent(
      longitude
    )}&property=phh2o&property=soc&property=sand&property=silt&property=clay&depth=0-5cm&value=mean`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch soil data" },
        { status: 502 }
      );
    }
    const json = await res.json();

    // SoilGrids v2 structure: properties.layers[].depths[].values.mean
    const layers = json?.properties?.layers ?? [];
    const readMean = (name: string): number => {
      const layer = layers.find((l: any) => l?.name === name);
      const mean = layer?.depths?.[0]?.values?.mean;
      return typeof mean === "number" ? mean : NaN;
    };

    const ph = readMean("phh2o");
    const soc = readMean("soc"); // g/kg; convert to % then to OM
    const sand = readMean("sand"); // %
    const silt = readMean("silt"); // %
    const clay = readMean("clay"); // %

    // Convert SOC (g/kg) to % (divide by 10), then to Organic Matter (%) ~ SOC% * 1.724
    const socPercent = isFinite(soc) ? soc / 10 : NaN;
    const organicMatter = isFinite(socPercent)
      ? +(socPercent * 1.724).toFixed(2)
      : null;
    const texture = [sand, silt, clay].every(
      (v) => typeof v === "number" && isFinite(v)
    )
      ? classifyTexture(sand, silt, clay)
      : null;

    const data = {
      farmId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      fetchedAt: new Date().toISOString(),
      ph: isFinite(ph) ? +ph.toFixed(2) : null,
      organicMatter, // %
      texture,
      fractions: {
        sand: isFinite(sand) ? +sand.toFixed(1) : null,
        silt: isFinite(silt) ? +silt.toFixed(1) : null,
        clay: isFinite(clay) ? +clay.toFixed(1) : null,
      },
      provider: "soilgrids",
      source: url,
    };

    await setDoc(doc(db, "soilData", farmId), data, { merge: true });

    return NextResponse.json(data);
  } catch (e) {
    const message = (e as { message?: string })?.message || "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
