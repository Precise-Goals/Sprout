"use client";
import AuthForm from "@components/AuthForm";
import Map from "@components/Map";
import CropCycleCard from "@components/CropCycleCard";
import IrrigationCard from "@components/IrrigationCard";
import { useAuth } from "@hooks/useAuth";
import { useFetch } from "@hooks/useFetch";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="mb-4 text-xl font-semibold">Sprout</h1>
        <AuthForm />
        <p className="mt-4 text-sm text-gray-500">
          Demo account: test@admin.com / testadmin
        </p>
      </div>
    );
  }

  const farmId = user?.uid || "demo";
  // Demo center; in real case, read from farmer profile document
  const latitude = 37.7749;
  const longitude = -122.4194;

  const { data: weather } = useFetch<any>("/api/weather", {
    params: { farmId, latitude, longitude },
  });
  const { data: soil } = useFetch<any>("/api/soil", {
    params: { farmId, latitude, longitude },
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4">
        <Map markers={[{ latitude, longitude, label: "Farm" }]} height={360} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CropCycleCard crop="Corn" weather={weather} soil={soil} />
        <IrrigationCard crop="Corn" weather={weather} soil={soil} />
      </div>
    </div>
  );
}
