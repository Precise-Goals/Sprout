"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useFetch } from "@hooks/useFetch";
import Map from "@components/Map";
import CropCycleCard from "@components/CropCycleCard";
import IrrigationCard from "@components/IrrigationCard";
import VoiceAssistant from "@components/VoiceAssistant";
import ChatBot from "@components/ChatBot";
import { db } from "@lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Farmer = {
  name?: string;
  farmName?: string;
  location?: { latitude?: number; longitude?: number };
  email?: string;
};

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const farmId = user?.uid || "demo";
  const [farmer, setFarmer] = useState<Farmer | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!farmId) return;
      try {
        const snap = await getDoc(doc(db, "farmers", farmId));
        if (mounted)
          setFarmer((snap.exists() ? (snap.data() as Farmer) : null) || null);
      } catch {
        /* ignore */
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [farmId]);

  const latitude = farmer?.location?.latitude ?? 37.7749;
  const longitude = farmer?.location?.longitude ?? -122.4194;

  const { data: weather } = useFetch<any>("/api/weather", {
    params: { farmId, latitude, longitude },
    skip: !isAuthenticated,
  });
  const { data: soil } = useFetch<any>("/api/soil", {
    params: { farmId, latitude, longitude },
    skip: !isAuthenticated,
  });

  const greeting = useMemo(
    () => farmer?.name || user?.email || "Farmer",
    [farmer?.name, user?.email]
  );

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Navbar */}
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3 shadow-sm">
        <div className="text-sm font-semibold">Sprout Dashboard</div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/yield"
            className="rounded border px-3 py-1 hover:bg-gray-50"
          >
            Yield Monitoring
          </Link>
          <Link
            href="/crops"
            className="rounded border px-3 py-1 hover:bg-gray-50"
          >
            Crop Recommender
          </Link>
          <a
            href="#voice"
            className="rounded border px-3 py-1 hover:bg-gray-50"
          >
            Voice Assistant
          </a>
          <a href="#chat" className="rounded border px-3 py-1 hover:bg-gray-50">
            Chatbot
          </a>
        </div>
      </nav>

      {/* Welcome & Farm Info */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="col-span-2 rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-lg font-semibold text-gray-900">
            Welcome, {greeting}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Farm: {farmer?.farmName || "Your Farm"}
          </div>
          <div className="mt-2">
            <Map
              markers={[
                { latitude, longitude, label: farmer?.farmName || "Farm" },
              ]}
              height={260}
            />
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 text-sm shadow-sm">
          <div className="font-medium text-gray-900">Farm info</div>
          <div className="mt-2 text-gray-700">
            <div>
              Location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </div>
            <div>Weather: {weather ? "loaded" : "loading..."}</div>
            <div>Soil: {soil ? "loaded" : "loading..."}</div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CropCycleCard crop="Corn" weather={weather} soil={soil} />
        <IrrigationCard crop="Corn" weather={weather} soil={soil} />
      </section>

      {/* Assistants */}
      <section
        id="voice"
        className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <VoiceAssistant />
        <div id="chat" className="">
          <ChatBot />
        </div>
      </section>
    </div>
  );
}
