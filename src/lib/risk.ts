import { prisma } from "./db";
import type { AirQualityReading } from "@prisma/client";
import { getEffectiveWindows, windowContains, dayOfYearUtc } from "./calendar";
import { roundHalfEven } from "./round";

// Faithful port of PollenAtlas/Services/RiskScale.cs + ForecastService.cs — the single
// source of truth for the §8 pollen + air-quality risk index, shared by the Forecast page,
// the Home dashboard card, the map risk layer, and the §9 alert engine.

// ── RiskScale ──────────────────────────────────────────────────────────────
/** Score → four-band severity (thresholds use >=). */
export function levelFor(score: number): string {
  if (score >= 8) return "Very high";
  if (score >= 5) return "High";
  if (score >= 2) return "Moderate";
  return "Low";
}

/** Per-taxon clinical concentration thresholds (grains/m³). Defaults are the generic
 *  EAN-style cutoffs; allergenic taxa carry their own EAACI-informed values. */
export interface Thresholds { moderate: number; high: number; veryHigh: number; }
export const DEFAULT_THRESHOLDS: Thresholds = { moderate: 10, high: 50, veryHigh: 150 };

/** Airborne concentration band (grains/m³) for one taxon, 0–4, using taxon-specific
 *  thresholds where available (EAACI/EAN benchmark — different pollens turn symptomatic
 *  at very different counts, so a single generic scale under/over-states real risk). */
export function concentrationBand(grainsPerCubicMeter: number, t: Thresholds = DEFAULT_THRESHOLDS): number {
  if (grainsPerCubicMeter >= t.veryHigh) return 4;
  if (grainsPerCubicMeter >= t.high) return 3;
  if (grainsPerCubicMeter >= t.moderate) return 2;
  if (grainsPerCubicMeter >= 1) return 1;
  return 0;
}

const BAND_LABELS = ["None", "Low", "Moderate", "High", "Very high"];
/** Concentration band (0–4) → level label (maps onto the same colours as visual()). */
export const bandLabel = (band: number) => BAND_LABELS[band] ?? "—";

/** Plain-language health advice for a risk level (public-health benchmark). */
export function healthAdvice(level: string): string {
  switch (level) {
    case "Very high":
      return "Avoid outdoor exposure where possible. High risk for asthma and allergy sufferers — keep rescue medication on hand. Hospitals may see elevated respiratory presentations.";
    case "High":
      return "Allergy sufferers should limit outdoor activity, keep windows closed, and consider taking antihistamines before going out.";
    case "Moderate":
      return "Sensitive individuals may notice symptoms; limit prolonged outdoor exposure during peak afternoon hours.";
    default:
      return "No special precautions needed for the general population.";
  }
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

// "Amaranthaceae-type pollen" → "Amaranthaceae"; trims the boilerplate suffix for notes.
const taxonShort = (name: string) => name.replace("-type pollen", "").replace(" pollen", "").trim();

export interface ForecastTaxon {
  pollenTypeId: number;
  type: string;
  species: string;
  imagePath: string | null;
  flowering: boolean;
  recordCount: number;
  measured: boolean;
  grainsPerM3: number | null;
  band: number | null;
  allergenWeight: number;
  contribution: number;
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
  hasMeasuredData: boolean;
  peakGrainsPerM3: number | null;
  peakTaxon: string | null;
}

// Trap samples within this many days of "now" count as the current airborne load
// (a little wider than the ~15-day collection cadence).
const RECENT_WINDOW_DAYS = 21;

const monthName = (m: number) =>
  new Date(Date.UTC(2000, m - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });

export async function computeForecast(regionId: number | null): Promise<ForecastResult> {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const since = new Date(now.getTime() - RECENT_WINDOW_DAYS * 86_400_000);

  // Allergenic taxa with their species' flowering + allergen weight.
  const allergenic = await prisma.pollenType.findMany({
    where: { plantSpecies: { isAllergenic: true } },
    select: {
      id: true, name: true, primaryImagePath: true, plantSpeciesId: true,
      thresholdModerate: true, thresholdHigh: true, thresholdVeryHigh: true,
      plantSpecies: { select: { scientificName: true, floweringMonths: true, allergenWeight: true } },
    },
  });

  // Record counts this month (region-scoped) per pollen type.
  const grouped = await prisma.pollenRecord.groupBy({
    by: ["pollenTypeId"],
    where: { month, ...(regionId != null ? { regionId } : {}) },
    _count: { _all: true },
  });
  const recCount = new Map(grouped.map((g) => [g.pollenTypeId, g._count._all]));

  // Live airborne load: peak grains/m³ measured at traps in this region within the
  // recent window, per pollen type — the trap's quantitative payload.
  const counts = await prisma.airborneSamplePollenCount.findMany({
    where: {
      grainsPerCubicMeter: { not: null },
      airborneSample: {
        sampledTo: { gte: since },
        ...(regionId != null ? { trapDevice: { regionId } } : {}),
      },
    },
    select: { pollenTypeId: true, grainsPerCubicMeter: true },
  });
  const concByType = new Map<number, number>();
  for (const c of counts) {
    if (c.grainsPerCubicMeter == null) continue;
    const cur = concByType.get(c.pollenTypeId);
    if (cur == null || c.grainsPerCubicMeter > cur) concByType.set(c.pollenTypeId, c.grainsPerCubicMeter);
  }

  // Region/year-aware flowering windows (§7); empty → flat FloweringMonths fallback below.
  const windows = await getEffectiveWindows(regionId, now.getUTCFullYear());
  const doy = dayOfYearUtc(now);

  const inSeason: ForecastTaxon[] = [];
  for (const t of allergenic) {
    const sp = t.plantSpecies!;
    const win = windows.get(t.plantSpeciesId);
    const flowering = win ? windowContains(win, doy) : monthsContains(sp.floweringMonths, month);
    const rc = recCount.get(t.id) ?? 0;
    const conc = concByType.get(t.id);
    const measured = conc != null && conc > 0;

    // Drop taxa with no signal at all (not measured, not in flower, no records).
    if (!measured && !flowering && rc === 0) continue;

    // Allergenic species default to a moderate weight (2) until a curator scores them.
    const weight = (sp.allergenWeight ?? 0) > 0 ? sp.allergenWeight : 2;
    const thresholds: Thresholds = {
      moderate: t.thresholdModerate ?? DEFAULT_THRESHOLDS.moderate,
      high: t.thresholdHigh ?? DEFAULT_THRESHOLDS.high,
      veryHigh: t.thresholdVeryHigh ?? DEFAULT_THRESHOLDS.veryHigh,
    };
    const band = measured ? concentrationBand(conc!, thresholds) : 0;
    // Measured load (band 0–4, taxon-specific thresholds) drives the score; otherwise the
    // calendar/record proxy. Both scale by weight/2 (moderate taxon neutral, severe doubles).
    const contribution = measured
      ? band * (weight / 2.0)
      : ((flowering ? 1 : 0) + (rc > 0 ? 1 : 0)) * (weight / 2.0);

    inSeason.push({
      pollenTypeId: t.id, type: t.name, species: sp.scientificName, imagePath: t.primaryImagePath,
      flowering, recordCount: rc, measured, grainsPerM3: measured ? conc! : null,
      band: measured ? band : null,
      allergenWeight: weight, contribution, intensity: roundHalfEven(contribution * 2),
    });
  }
  inSeason.sort(
    (a, b) =>
      b.contribution - a.contribution ||
      Number(b.measured) - Number(a.measured) ||
      a.type.localeCompare(b.type),
  );

  // Peak-taxon-driven aggregate: the worst offender sets the headline; co-occurring
  // allergens add half their contribution, capped at +2.
  let pollenScore = 0;
  if (inSeason.length > 0) {
    const others = inSeason.slice(1).reduce((s, t) => s + t.contribution, 0);
    pollenScore = inSeason[0].contribution + Math.min(2.0, 0.5 * others);
  }

  const latestAir = await prisma.airQualityReading.findFirst({
    where: regionId != null ? { regionId } : {},
    orderBy: { measuredAt: "desc" },
  });

  const notes: string[] = [];
  const peak = inSeason.find((t) => t.measured) ?? null;
  if (peak) notes.push(`trap peak ${taxonShort(peak.type)} ${Math.round(peak.grainsPerM3!)} grains/m³`);
  if (inSeason.length > 0) notes.push(`${inSeason.length} allergenic taxa active`);

  // §8: pollution amplifies pollen risk — dust or high particulates push the band up.
  let airBump = 0;
  if (latestAir?.dustEvent) { airBump += 3; notes.push("active dust event"); }
  if (latestAir?.pm10 != null) {
    if (latestAir.pm10 > 150) { airBump += 3; notes.push("very high PM10"); }
    else if (latestAir.pm10 > 80) { airBump += 1; notes.push("elevated PM10"); }
  }

  const score = roundHalfEven(pollenScore) + airBump; // round THEN add bump (Atlas order)
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
    hasMeasuredData: peak != null,
    peakGrainsPerM3: peak?.grainsPerM3 ?? null,
    peakTaxon: peak ? taxonShort(peak.type) : null,
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
 *  Forecast page, Home card, and alerts all report the same severity. */
export async function computeRegionRisks(): Promise<RegionRisk[]> {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  const result: RegionRisk[] = [];
  for (const reg of regions) {
    const f = await computeForecast(reg.id);
    const v = visual(f.riskLevel);
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
      activeTaxa: f.inSeason.length, // all in-season taxa (Atlas MapController: InSeason.Count)
      topPollen: f.inSeason.slice(0, 3).map((t) => t.type), // top-3 by contribution
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
