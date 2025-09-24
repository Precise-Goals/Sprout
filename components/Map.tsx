"use client";
import { useEffect, useMemo, useRef } from "react";

type MapMarker = {
  id?: string;
  latitude: number;
  longitude: number;
  label?: string;
};

type MapProps = {
  markers: MapMarker[];
  zoom?: number;
  className?: string;
  height?: number | string; // e.g., 320 or "300px" or "50vh"
};

// Load Leaflet from CDN to avoid adding dependencies
function ensureLeafletLoaded(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as { L?: any };
  if (w.L) return Promise.resolve(w.L);

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-sprout="leaflet-js"]'
  );
  const existingCss = document.querySelector<HTMLLinkElement>(
    'link[data-sprout="leaflet-css"]'
  );

  return new Promise((resolve, reject) => {
    const onReady = () => {
      const L = (window as any).L;
      if (L) resolve(L);
      else reject(new Error("Leaflet failed to load"));
    };

    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      link.setAttribute("data-sprout", "leaflet-css");
      document.head.appendChild(link);
    }

    if (existing) {
      if ((window as any).L) onReady();
      else existing.addEventListener("load", onReady, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-sprout", "leaflet-js");
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Leaflet script failed")),
      { once: true }
    );
    document.body.appendChild(script);
  });
}

export default function Map({
  markers,
  zoom = 11,
  className,
  height = 320,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  const center = useMemo(() => {
    const first = markers?.[0];
    return first ? [first.latitude, first.longitude] : [0, 0];
  }, [markers]);

  useEffect(() => {
    let canceled = false;
    ensureLeafletLoaded()
      .then((L) => {
        if (canceled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current).setView(center, zoom);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
          }).addTo(mapRef.current);
        } else {
          mapRef.current.setView(center, zoom);
        }

        // Reset markers layer
        if (layerRef.current) {
          layerRef.current.clearLayers();
        } else {
          layerRef.current = L.layerGroup().addTo(mapRef.current);
        }

        markers?.forEach((m) => {
          const marker = L.marker([m.latitude, m.longitude]);
          if (m.label) marker.bindPopup(m.label);
          marker.addTo(layerRef.current);
        });

        // Fit bounds if multiple markers
        if (markers && markers.length > 1) {
          const bounds = L.latLngBounds(
            markers.map((m) => [m.latitude, m.longitude] as [number, number])
          );
          mapRef.current.fitBounds(bounds.pad(0.2));
        }
      })
      .catch(() => {
        // swallow errors to avoid breaking UI
      });

    return () => {
      canceled = true;
    };
  }, [center[0], center[1], zoom, JSON.stringify(markers)]);

  const containerStyle = useMemo(() => {
    const h = typeof height === "number" ? `${height}px` : height;
    return { height: h, width: "100%" } as const;
  }, [height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      aria-label="Farm map"
      role="region"
    />
  );
}
