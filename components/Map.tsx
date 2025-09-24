"use client";
import { useEffect, useMemo, useRef } from "react";

type MapMarker = {
  id?: string;
  latitude: number;
  longitude: number;
  label?: string;
};

type MapCircle = {
  id?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g., 1000 for 1 km
  color?: string;
  label?: string;
};

type MapPolygon = {
  id?: string;
  points: Array<{ latitude: number; longitude: number }>;
  color?: string;
  label?: string;
};

type MapProps = {
  markers?: MapMarker[];
  circles?: MapCircle[];
  polygons?: MapPolygon[];
  zoom?: number;
  className?: string;
  height?: number | string; // e.g., 320 or "300px" or "50vh"
  tileProvider?: "osm" | "opentopo" | "terrain" | "esri" | "maptiler"; // terrain uses OpenTopo
  terrainOverlay?: boolean; // add hillshade/terrain overlay
  onPolygonClick?: (polygonId?: string) => void;
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
  markers = [],
  circles = [],
  polygons = [],
  zoom = 11,
  className,
  height = 320,
  tileProvider = "opentopo",
  terrainOverlay = false,
  onPolygonClick,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);

  const center = useMemo(() => {
    const first = markers?.[0] || circles?.[0];
    return first ? [first.latitude, first.longitude] : [0, 0];
  }, [markers, circles]);

  useEffect(() => {
    let canceled = false;
    ensureLeafletLoaded()
      .then((L) => {
        if (canceled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current).setView(center, zoom);
        } else {
          mapRef.current.setView(center, zoom);
        }

        const providers: Record<string, { url: string; options: any }> = {
          osm: {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            options: {
              attribution: "&copy; OpenStreetMap contributors",
              maxZoom: 19,
            },
          },
          opentopo: {
            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            options: {
              attribution:
                "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
              maxZoom: 17,
            },
          },
          terrain: {
            url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
            options: {
              attribution:
                "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
              maxZoom: 17,
            },
          },
          esri: {
            // ESRI World Imagery (satellite)
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            options: {
              attribution: "Tiles &copy; Esri",
              maxZoom: 19,
            },
          },
          maptiler: {
            // MapTiler Satellite (requires key via NEXT_PUBLIC_MAPTILER_KEY)
            url: `https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=${
              process.env.NEXT_PUBLIC_MAPTILER_KEY || ""
            }`,
            options: {
              attribution: "&copy; MapTiler & OpenStreetMap contributors",
              maxZoom: 20,
            },
          },
        };

        const selected = providers[tileProvider] || providers.osm;
        if (tileLayerRef.current) {
          mapRef.current.removeLayer(tileLayerRef.current);
          tileLayerRef.current = null;
        }
        tileLayerRef.current = L.tileLayer(selected.url, selected.options);
        tileLayerRef.current.addTo(mapRef.current);

        // Optional terrain/hillshade overlay (ESRI World Hillshade)
        if (overlayRef.current) {
          mapRef.current.removeLayer(overlayRef.current);
          overlayRef.current = null;
        }
        if (terrainOverlay) {
          overlayRef.current = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: "Hillshade &copy; Esri",
              maxZoom: 19,
              opacity: 0.6,
            }
          );
          overlayRef.current.addTo(mapRef.current);
        }

        // Reset markers/circles layer
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

        circles?.forEach((c) => {
          const circle = L.circle([c.latitude, c.longitude], {
            radius: c.radiusMeters,
            color: c.color || "#059669", // emerald-600
            weight: 2,
            fillColor: c.color || "#059669",
            fillOpacity: 0.1,
          });
          if (c.label) circle.bindPopup(c.label);
          circle.addTo(layerRef.current);
        });

        polygons?.forEach((p) => {
          const latlngs = p.points.map((pt) => [pt.latitude, pt.longitude]);
          const poly = L.polygon(latlngs as any, {
            color: p.color || "#2563eb", // blue-600
            weight: 2,
            fillColor: p.color || "#2563eb",
            fillOpacity: 0.1,
          });
          if (p.label) poly.bindPopup(p.label);
          if (onPolygonClick) {
            poly.on("click", () => onPolygonClick(p.id));
          }
          poly.addTo(layerRef.current);
        });

        // Fit bounds if multiple overlays
        const points: [number, number][] = [];
        markers?.forEach((m) => points.push([m.latitude, m.longitude]));
        circles?.forEach((c) => points.push([c.latitude, c.longitude]));
        polygons?.forEach((p) =>
          p.points.forEach((pt) => points.push([pt.latitude, pt.longitude]))
        );
        if (points.length > 1) {
          const bounds = L.latLngBounds(points);
          mapRef.current.fitBounds(bounds.pad(0.2));
        }
      })
      .catch(() => {
        // swallow errors to avoid breaking UI
      });

    return () => {
      canceled = true;
    };
  }, [
    center[0],
    center[1],
    zoom,
    JSON.stringify(markers),
    JSON.stringify(circles),
    JSON.stringify(polygons),
    tileProvider,
    terrainOverlay,
  ]);

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
