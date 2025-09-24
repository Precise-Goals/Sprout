import { NextResponse } from "next/server";
import { db } from "@lib/firebase";
import { doc, setDoc } from "firebase/firestore";

type Inputs = {
  farmId: string;
  location?: { latitude?: number; longitude?: number };
  waterAvailability?: "low" | "medium" | "high"; // seasonal irrigation capacity
  history?: Array<{ crop: string; year?: number }>;
  affordability?: { maxCostIndex?: number };
};

const CATALOG = [
  {
    crop: "Corn",
    key: "corn",
    baseKc: 1.1,
    waterDemand: "high",
    costIndex: 3,
    tempRange: [15, 30],
  },
  {
    crop: "Wheat",
    key: "wheat",
    baseKc: 1.0,
    waterDemand: "medium",
    costIndex: 2,
    tempRange: [5, 25],
  },
  {
    crop: "Rice",
    key: "rice",
    baseKc: 1.05,
    waterDemand: "high",
    costIndex: 3,
    tempRange: [18, 35],
  },
  {
    crop: "Soybean",
    key: "soybean",
    baseKc: 1.05,
    waterDemand: "medium",
    costIndex: 2,
    tempRange: [10, 30],
  },
  {
    crop: "Barley",
    key: "barley",
    baseKc: 0.95,
    waterDemand: "low",
    costIndex: 1,
    tempRange: [3, 22],
  },
  {
    crop: "Sorghum",
    key: "sorghum",
    baseKc: 0.9,
    waterDemand: "low",
    costIndex: 1,
    tempRange: [15, 35],
  },
];

function scoreCrop(input: Inputs, avgTemp?: number) {
  const lastYear = Math.max(...(input.history?.map((h) => h.year || 0) || [0]));
  const lastCrop = input.history
    ?.find((h) => (h.year || 0) === lastYear)
    ?.crop?.toLowerCase();
  const maxCost = input.affordability?.maxCostIndex ?? 3;
  const water = input.waterAvailability || "medium";

  return CATALOG.filter((c) => c.costIndex <= maxCost)
    .map((c) => {
      let score = 50;
      // Water suitability
      if (water === "low" && c.waterDemand === "low") score += 20;
      if (water === "low" && c.waterDemand === "high") score -= 20;
      if (water === "high" && c.waterDemand !== "high") score -= 5;
      if (water === "medium" && c.waterDemand === "medium") score += 10;

      // Rotation penalty for repeating last crop
      if (lastCrop && c.key === lastCrop.toLowerCase()) score -= 15;

      // Temperature band heuristic if avg provided
      if (typeof avgTemp === "number") {
        const [tMin, tMax] = c.tempRange;
        if (avgTemp >= tMin && avgTemp <= tMax) score += 10;
        else score -= 10;
      }

      // Cost friendliness
      score += (3 - c.costIndex) * 3; // lower costIndex => higher score

      return {
        crop: c.crop,
        key: c.key,
        score: Math.max(0, Math.min(100, Math.round(score))),
        hints: {
          water: c.waterDemand,
          baseKc: c.baseKc,
          costIndex: c.costIndex,
        },
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Inputs & { avgTemp?: number };
    const {
      farmId,
      location,
      waterAvailability,
      history,
      affordability,
      avgTemp,
    } = body;
    if (!farmId) {
      return NextResponse.json(
        { error: "farmId is required" },
        { status: 400 }
      );
    }

    const recommendations = scoreCrop(
      { farmId, location, waterAvailability, history, affordability },
      avgTemp
    );

    const payload = {
      farmId,
      location: location || null,
      waterAvailability: waterAvailability || null,
      affordability: affordability || null,
      history: history || [],
      recommendations,
      generatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "cropRecommendations", farmId), payload, {
      merge: true,
    });

    return NextResponse.json(payload);
  } catch (e) {
    const message =
      (e as { message?: string })?.message || "Failed to recommend crops";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
