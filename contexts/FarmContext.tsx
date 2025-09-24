"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";

type Coordinates = { latitude: number; longitude: number } | null;

type FarmContextValue = {
  farmId: string;
  location: Coordinates;
  setLocation: (coords: Coordinates) => void;
  placeLabel: string | null;
  setPlaceLabel: (label: string | null) => void;
  geoError: string | null;
};

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState<Coordinates>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Restore from session if available
    try {
      const saved = sessionStorage.getItem("sprout_location");
      const savedLabel = sessionStorage.getItem("sprout_place_label");
      if (saved) setLocation(JSON.parse(saved));
      if (savedLabel) setPlaceLabel(savedLabel);
      if (saved) return; // if restored, don't auto-geolocate
    } catch {
      // ignore
    }
    if (!navigator?.geolocation) {
      setGeoError("Geolocation not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(coords);
        try {
          sessionStorage.setItem("sprout_location", JSON.stringify(coords));
        } catch {}
        setGeoError(null);
      },
      () => setGeoError("Permission denied or unable to get location."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isAuthenticated]);

  const farmId = user?.uid || "demo";

  return (
    <FarmContext.Provider
      value={{
        farmId,
        location,
        setLocation: (coords) => {
          setLocation(coords);
          try {
            sessionStorage.setItem("sprout_location", JSON.stringify(coords));
          } catch {}
        },
        placeLabel,
        setPlaceLabel: (label) => {
          setPlaceLabel(label);
          try {
            if (label) sessionStorage.setItem("sprout_place_label", label);
            else sessionStorage.removeItem("sprout_place_label");
          } catch {}
        },
        geoError,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarm must be used within FarmProvider");
  return ctx;
}
