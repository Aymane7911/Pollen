import { prisma } from "@/lib/db";
import type { AirQualityReading } from "@prisma/client";

// Port of PollenAtlas/Services/RiskScale.cs + ForecastService.cs — the single
// source of truth for the §8 pollen + air-quality risk index, shared by the
// Forecast page, the Home dashboard card, and the map risk layer.

/** Score → level (four-band severity). */
export function levelFor(score: number): string {
  if (score >= 8) return "Very high";
  if (score >= 5) return "High";
  if (score >= 2) return "Moderate";
  return "Low";
}

/** Level → colour band. bg/fg are the rendered swatch colours. */
export function visual(level: string): { band: string; bg: string; fg: string } {
  switch (level) {
    case "Very high": return { band: "red", bg: "#b3261e", fg: "#ffffff" };
    case "High": return { band: "orange", bg: "#d9730d", fg: "#ffffff" };
    case "Moderate": return { band: "yellow", bg: "#c98a2b", fg: "#15130c" };
    default: return { band: "green", bg: "#1f5d3a", fg: "#ffffff" };
  }
}

function monthsContains(csv: string | null, month: number): boolean {
  if (!csv) return false;
  return csv.split(",").map((s) => s.trim()).filter(Boolean).some((p) => parseInt(p, 10) === month);
}

export interface ForecastTaxon {
  pollenTypeId: number;
  type: string;
  species: string;
  imagePath: string | null;
  flowering: boolean;
  recordCount: number;
  intensity: number;
}

export interface ForecastResult {
  month: number;
  monthName: string;
  regionId: number | null;
  regionName: string;
  riskLevel: string;
  riskScore: number;
  riskNote: string;
  inSeason: ForecastTaxon[];
  latestAir: AirQualityReading | null;
}

const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" });

export async function computeForecast(regionId: number | null): Promise<ForecastResult> {
  const month = new Date().getMonth() + 1;

  const allergenic = await prisma.pollenType.findMany({
    where: { plantSpecies: { isAllergenic: true } },
    include: { plantSpecies: true },
  });

  const grouped = await prisma.pollenRecord.groupBy({
    by: ["pollenTypeId"],
    where: { month, ...(regionId != null ? { regionId } : {}) },
    _count: { _all: true },
  });
  const recCount = new Map(grouped.map((g) => [g.pollenTypeId, g._count._all]));

  const inSeason: ForecastTaxon[] = [];
  for (const t of allergenic) {
    const flowering = monthsContains(t.plantSpecies.floweringMonths, month);
    const rc = recCount.get(t.id) ?? 0;
    if (!flowering && rc === 0) continue;
    inSeason.push({
      pollenTypeId: t.id,
      type: t.name,
      species: t.plantSpecies.scientificName,
      imagePath: t.primaryImagePath,
      flowering,
      recordCount: rc,
      intensity: (flowering ? 2 : 0) + rc,
    });
  }
  inSeason.sort((a, b) => b.intensity - a.intensity || a.type.localeCompare(b.type));

  const latestAir = await prisma.airQualityReading.findFirst({
    where: regionId != null ? { regionId } : {},
    orderBy: { measuredAt: "desc" },
  });

  let score = inSeason.filter((t) => t.flowering).length;
  const notes: string[] = [];
  if (inSeason.length > 0) notes.push(`${inSeason.length} allergenic taxa active`);
  if (latestAir?.dustEvent) { score += 3; notes.push("active dust event"); }
  if (latestAir?.pm10 != null) {
    if (latestAir.pm10 > 150) { score += 3; notes.push("very high PM10"); }
    else if (latestAir.pm10 > 80) { score += 1; notes.push("elevated PM10"); }
  }

  const region = regionId != null ? await prisma.region.findUnique({ where: { id: regionId } }) : null;

  return {
    month,
    monthName: monthName(month),
    regionId,
    regionName: region?.name ?? "All UAE",
    riskLevel: levelFor(score),
    riskScore: score,
    riskNote: notes.length ? notes.join(" · ") : "No active allergenic pollen on record",
    inSeason,
    latestAir,
  };
}

export interface RegionRisk {
  regionId: number;
  regionName: string;
  latitude: number | null;
  longitude: number | null;
  score: number;
  level: string;
  band: string;
  colorBg: string;
  note: string;
  activeTaxa: number;
  topPollen: string[];
  pm25: number | null;
  pm10: number | null;
  dustEvent: boolean;
  windDirectionDeg: number | null;
  windSpeedMs: number | null;
  airMeasuredAt: Date | null;
}

/** Per-region risk for the map §8 layer — reuses computeForecast so the map,
 *  Forecast page, and Home card all report the same severity. */
export async function computeRegionRisks(): Promise<RegionRisk[]> {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const result: RegionRisk[] = [];
  for (const reg of regions) {
    const f = await computeForecast(reg.id);
    const v = visual(f.riskLevel);
    const flowering = f.inSeason.filter((t) => t.flowering);
    result.push({
      regionId: reg.id,
      regionName: reg.name,
      latitude: reg.latitude,
      longitude: reg.longitude,
      score: f.riskScore,
      level: f.riskLevel,
      band: v.band,
      colorBg: v.bg,
      note: f.riskNote,
      activeTaxa: flowering.length,
      topPollen: flowering.slice(0, 3).map((t) => t.type),
      pm25: f.latestAir?.pm25 ?? null,
      pm10: f.latestAir?.pm10 ?? null,
      dustEvent: f.latestAir?.dustEvent ?? false,
      windDirectionDeg: f.latestAir?.windDirectionDeg ?? null,
      windSpeedMs: f.latestAir?.windSpeedMs ?? null,
      airMeasuredAt: f.latestAir?.measuredAt ?? null,
    });
  }
  return result;
}
