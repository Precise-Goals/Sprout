import { NextResponse } from "next/server";
import { db, storage } from "@lib/firebase";
import { ref, uploadBytes } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const farmId =
      (formData.get("farmId") as string | null) ||
      url.searchParams.get("farmId");

    if (!farmId) {
      return NextResponse.json(
        { error: "farmId is required" },
        { status: 400 }
      );
    }
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload raw CSV to Storage (optional but useful)
    const storageRef = ref(
      storage,
      `yield/${encodeURIComponent(farmId)}/${Date.now()}-${file.name}`
    );
    await uploadBytes(storageRef, await file.arrayBuffer());

    // Parse CSV (minimal, no external deps): expects headers including year,yield[,crop]
    const csvText = await file.text();
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must include header and at least one row" },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const idxYear = headers.findIndex((h) => h === "year");
    const idxYield = headers.findIndex(
      (h) => h === "yield" || h === "yield_t_ha" || h === "yield_kg_ha"
    );
    const idxCrop = headers.findIndex((h) => h === "crop");
    if (idxYear === -1 || idxYield === -1) {
      return NextResponse.json(
        { error: "CSV headers must include 'year' and 'yield'" },
        { status: 400 }
      );
    }

    const entries = lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",");
        const year = Number(cols[idxYear]?.trim());
        const yieldVal = Number(cols[idxYield]?.trim());
        const crop = idxCrop !== -1 ? cols[idxCrop]?.trim() : undefined;
        return { year, yield: yieldVal, crop };
      })
      .filter((r) => Number.isFinite(r.year) && Number.isFinite(r.yield));

    const years = entries.map((e) => e.year);
    const summary = {
      entries: entries.length,
      earliestYear: years.length ? Math.min(...years) : null,
      latestYear: years.length ? Math.max(...years) : null,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(
      doc(db, "yieldHistory", farmId),
      { farmId, summary, entries },
      { merge: true }
    );

    return NextResponse.json({ farmId, ...summary });
  } catch (e) {
    const message =
      (e as { message?: string })?.message || "Failed to process CSV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
