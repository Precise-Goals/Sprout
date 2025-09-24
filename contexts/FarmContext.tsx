"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";

type Coordinates = { latitude: number; longitude: number } | null;

type FarmContextValue = {
  farmId: string;
  location: Coordinates;
  setLocation: (coords: Coordinates) => void;
  geoError: string | null;
};

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState<Coordinates>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!navigator?.geolocation) {
      setGeoError("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGeoError(null);
      },
      () => setGeoError("Permission denied or unable to get location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isAuthenticated]);

  const farmId = user?.uid || "demo";

  return (
    <FarmContext.Provider value={{ farmId, location, setLocation, geoError }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarm must be used within FarmProvider");
  return ctx;
}
