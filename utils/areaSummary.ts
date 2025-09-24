import type { LatLng } from "@/services/agroMonitoring";

// Rough polygon area using spherical excess approximation (small polygons)
export function computePolygonAreaSqM(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const R = 6371000;
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const lon1 = (p1.longitude * Math.PI) / 180;
    const lon2 = (p2.longitude * Math.PI) / 180;
    const lat1 = (p1.latitude * Math.PI) / 180;
    const lat2 = (p2.latitude * Math.PI) / 180;
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  const area = Math.abs((total * R * R) / 2);
  return area;
}

export function formatHectares(areaSqM: number): string {
  const ha = areaSqM / 10000;
  return `${ha.toFixed(2)} ha`;
}
