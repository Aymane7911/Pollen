import { prisma } from "./db";

// Port of PollenAtlas/Services/FloweringCalendarService.cs — §7 region/year-aware
// flowering windows in day-of-year, with implicit carry-forward and a curated day-shift.
// The forecast asks "what is in flower at region R on date D"; where no curated entry
// exists it falls back (in risk.ts) to the species' flat FloweringMonths CSV.

export interface FloweringWindow {
  startDoy: number;
  endDoy: number;
  peakDoy: number | null;
}

/** Day-of-year membership; handles windows that wrap the new year (end < start). */
export function windowContains(w: FloweringWindow, dayOfYear: number): boolean {
  return w.startDoy <= w.endDoy
    ? dayOfYear >= w.startDoy && dayOfYear <= w.endDoy
    : dayOfYear >= w.startDoy || dayOfYear <= w.endDoy; // wraps the new year
}

/** UTC day-of-year (Jan 1 = 1), matching C# DateTime.UtcNow.DayOfYear. */
export function dayOfYearUtc(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - start) / 86_400_000) + 1;
}

// Apply a day shift, wrapping into 1..365. A zero shift returns the day exactly.
export function shift(doy: number, shiftDays: number): number {
  return shiftDays === 0 ? doy : ((((doy - 1 + shiftDays) % 365) + 365) % 365) + 1;
}

/**
 * Effective flowering window per species for a region+year. A region-specific entry
 * wins over the UAE-wide (null-region) default, and within the same scope the most
 * recent year ≤ `year` wins (implicit carry-forward). The curated shift is applied.
 */
export async function getEffectiveWindows(
  regionId: number | null,
  year: number,
): Promise<Map<number, FloweringWindow>> {
  const entries = await prisma.floweringCalendarEntry.findMany({
    where: {
      year: { lte: year },
      OR: regionId != null ? [{ regionId: null }, { regionId }] : [{ regionId: null }],
    },
    select: {
      plantSpeciesId: true, regionId: true, year: true,
      startDoy: true, endDoy: true, peakDoy: true, shiftDays: true,
    },
  });

  type Best = { regionSpecific: boolean; year: number; start: number; end: number; peak: number | null; shift: number };
  const best = new Map<number, Best>();
  for (const e of entries) {
    const regionSpecific = e.regionId != null;
    const cur = best.get(e.plantSpeciesId);
    if (cur) {
      const better =
        (regionSpecific && !cur.regionSpecific) ||
        (regionSpecific === cur.regionSpecific && e.year > cur.year);
      if (!better) continue;
    }
    best.set(e.plantSpeciesId, {
      regionSpecific, year: e.year, start: e.startDoy, end: e.endDoy, peak: e.peakDoy, shift: e.shiftDays,
    });
  }

  const out = new Map<number, FloweringWindow>();
  for (const [speciesId, v] of best) {
    out.set(speciesId, {
      startDoy: shift(v.start, v.shift),
      endDoy: shift(v.end, v.shift),
      peakDoy: v.peak != null ? shift(v.peak, v.shift) : null,
    });
  }
  return out;
}

/**
 * Materialises carry-forward rows (§7): for every (species, region) with a window in a
 * prior year but none for `targetYear`, copies the most recent prior window into the
 * target year flagged carriedForward. Returns the number of rows created. (Admin action;
 * not invoked by the read-only UI, included for logic parity.)
 */
export async function carryForward(targetYear: number): Promise<number> {
  const prior = await prisma.floweringCalendarEntry.findMany({ where: { year: { lte: targetYear } } });
  const groups = new Map<string, typeof prior>();
  for (const e of prior) {
    const key = `${e.plantSpeciesId}:${e.regionId ?? "null"}`;
    const g = groups.get(key);
    if (g) g.push(e);
    else groups.set(key, [e]);
  }
  const toCreate: {
    plantSpeciesId: number; regionId: number | null; year: number;
    startDoy: number; endDoy: number; peakDoy: number | null; shiftDays: number;
    carriedForward: boolean; notes: string;
  }[] = [];
  for (const g of groups.values()) {
    if (g.some((e) => e.year === targetYear)) continue;
    const latest = g.reduce((a, b) => (b.year > a.year ? b : a));
    toCreate.push({
      plantSpeciesId: latest.plantSpeciesId, regionId: latest.regionId, year: targetYear,
      startDoy: latest.startDoy, endDoy: latest.endDoy, peakDoy: latest.peakDoy, shiftDays: latest.shiftDays,
      carriedForward: true, notes: `Carried forward from ${latest.year}.`,
    });
  }
  if (toCreate.length) await prisma.floweringCalendarEntry.createMany({ data: toCreate });
  return toCreate.length;
}
