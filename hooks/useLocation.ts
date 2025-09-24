"use client";
import { useFarm } from "@/contexts/FarmContext";

export function useLocationControls() {
  const { location, setLocation, placeLabel, setPlaceLabel, geoError, farmId } =
    ((): any => require("@/contexts/FarmContext").useFarm)();
  // The above indirection helps with client-only import safety in Next
  return {
    farmId,
    location,
    placeLabel,
    geoError,
    setPlaceLabel,
    setLocation,
    locateDevice: () => {
      if (!navigator?.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setPlaceLabel("My location");
        },
        () => {
          /* ignore */
        }
      );
    },
  } as const;
}
