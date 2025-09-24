import { NextResponse } from "next/server";
import { db } from "@lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
      latitude
    )}&longitude=${encodeURIComponent(
      longitude
    )}&hourly=temperature_2m,precipitation`;

    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch weather" },
        { status: 502 }
      );
    }
    const json = await res.json();

    const data = {
      farmId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      fetchedAt: new Date().toISOString(),
      hourly: {
        time: json?.hourly?.time ?? [],
        temperature_2m: json?.hourly?.temperature_2m ?? [],
        precipitation: json?.hourly?.precipitation ?? [],
      },
      provider: "open-meteo",
    };

    await setDoc(doc(db, "weatherData", farmId), data, { merge: true });

    return NextResponse.json(data);
  } catch (e) {
    const message = (e as { message?: string })?.message || "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
