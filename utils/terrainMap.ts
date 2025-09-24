export type TerrainProvider = "osm" | "opentopo" | "terrain";

export const TERRAIN_DEFAULT: TerrainProvider = "terrain";

export function resolveTerrainProvider(p?: TerrainProvider) {
  switch (p) {
    case "osm":
      return { key: "osm" as const };
    case "opentopo":
    case "terrain":
    default:
      return { key: "terrain" as const };
  }
}
