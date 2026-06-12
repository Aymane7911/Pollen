// Imports the real Atlas data export (SQL Server "PollenAtlas", 2026-06-09) into
// the Next.js Prisma/Postgres database — replacing the synthetic seed. Source of
// truth: C:\Users\kalmi\Atlas\exports\atlas-export-2026-06-09\data\*.csv (11 files).
//
// Faithful port notes:
//  - Atlas stores enums as ints; here they map to the string labels in src/lib/enums.ts.
//  - Geo "Location"/"Centroid" are exported as WKT POINT(lng lat); we keep lat/lng.
//  - ASP.NET Identity tables were excluded from the export, so user FKs (CollectorId,
//    ValidatedById, UploadedById, ReviewedById, CreatedById) are dropped. The opaque
//    ActorId GUID on ValidationLog is preserved (no user table to join, but kept as data).
//  - PlantSpecies.AllergenWeight was not in the export → stays at the schema default 0.
//  - Original primary keys are preserved so every foreign key lines up.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DATA = "C:/Users/kalmi/Atlas/exports/atlas-export-2026-06-09/data";

type Row = Record<string, string>;
const readCsv = (name: string): Row[] =>
  parse(readFileSync(join(DATA, name)), {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

// ── value coercion ────────────────────────────────────────────────────────
const s = (v?: string): string | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};
const reqS = (v?: string): string => (v ?? "").trim();
const num = (v?: string): number | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : Number(t);
};
const int = (v?: string): number | null => {
  const t = (v ?? "").trim();
  return t === "" ? null : parseInt(t, 10);
};
const intD = (v: string | undefined, d: number): number => {
  const x = int(v);
  return x === null ? d : x;
};
const bool = (v?: string): boolean => (v ?? "").trim().toLowerCase() === "true";
const date = (v?: string): Date | null => {
  const t = (v ?? "").trim();
  if (!t) return null;
  const d = new Date(t); // US "M/d/yyyy h:mm:ss AM/PM", parsed in the server's local tz
  if (isNaN(d.getTime())) return null;
  // The export stores naive wall-clock times (no timezone). Reinterpret the local
  // components as UTC so the calendar date is preserved on any server tz (no off-by-one).
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
};
const reqDate = (v?: string): Date => date(v) ?? new Date(0);

// WKT "POINT (lng lat)" → { lat, lng }
const wkt = (v?: string): { lat: number | null; lng: number | null } => {
  const m = (v ?? "").match(/POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/i);
  return m ? { lng: parseFloat(m[1]), lat: parseFloat(m[2]) } : { lat: null, lng: null };
};

// int-enum → string label (Atlas Models/Enums.cs)
const mapEnum =
  (table: Record<number, string>, fallback: string) =>
  (v?: string): string => {
    const i = int(v);
    return i === null ? fallback : table[i] ?? fallback;
  };

const NativeStatus = mapEnum({ 0: "Unknown", 1: "Native", 2: "Endemic", 3: "Introduced", 4: "Cultivated", 5: "Invasive" }, "Unknown");
const Habitat = mapEnum({ 0: "Unspecified", 1: "Desert", 2: "Mountain", 3: "Wadi", 4: "Coastal", 5: "Mangrove", 6: "Urban", 7: "Agricultural", 8: "ProtectedArea", 99: "Other" }, "Unspecified");
const Flowering = mapEnum({ 0: "Unknown", 1: "Winter", 2: "Spring", 3: "Summer", 4: "Autumn", 5: "YearRound", 6: "Variable" }, "Unknown");
const Shape = mapEnum({ 0: "Unknown", 1: "Spheroidal", 2: "Prolate", 3: "Oblate", 4: "Subprolate", 5: "Suboblate", 6: "Perprolate", 7: "Peroblate", 99: "Other" }, "Unknown");
const Aperture = mapEnum({ 0: "Unknown", 1: "Inaperturate", 2: "Monosulcate", 3: "Tricolpate", 4: "Tricolporate", 5: "Triporate", 6: "Polycolpate", 7: "Polyporate", 8: "Stephanocolpate", 99: "Other" }, "Unknown");
const Surface = mapEnum({ 0: "Unknown", 1: "Psilate", 2: "Scabrate", 3: "Verrucate", 4: "Reticulate", 5: "Echinate", 6: "Striate", 7: "Foveolate", 8: "Rugulate", 9: "Gemmate", 99: "Other" }, "Unknown");
const Status = mapEnum({ 0: "Draft", 1: "Submitted", 2: "UnderReview", 3: "Validated", 4: "Rejected", 5: "Published" }, "Draft");
const Source = mapEnum({ 1: "AirborneTrap", 2: "FieldPlantSample", 3: "EnvironmentalSample", 4: "HoneySample", 5: "ReferenceCollection", 99: "Other" }, "FieldPlantSample");
const TrapStatus = mapEnum({ 0: "Planned", 1: "Installed", 2: "Active", 3: "Maintenance", 4: "Faulty", 5: "Decommissioned" }, "Planned");
const Microscope = mapEnum({ 1: "LightMicroscopy", 2: "SEM", 3: "TEM", 4: "Confocal", 5: "Fluorescence", 99: "Other" }, "LightMicroscopy");

async function main() {
  // 1. Clear everything (FK-safe reverse order, incl. the new Atlas-parity tables).
  await prisma.validationLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.alertRule.deleteMany();
  await prisma.alertRecipient.deleteMany();
  await prisma.pollenImage.deleteMany();
  await prisma.airborneSamplePollenCount.deleteMany();
  await prisma.airQualityReading.deleteMany();
  await prisma.beehive.deleteMany();
  await prisma.floweringCalendarEntry.deleteMany();
  await prisma.pollenRecord.deleteMany();
  await prisma.airborneSample.deleteMany();
  await prisma.trapDevice.deleteMany();
  await prisma.pollenType.deleteMany();
  await prisma.plantSpecies.deleteMany();
  await prisma.region.deleteMany();

  // 2. Insert in FK-safe order, preserving original primary keys.
  await prisma.region.createMany({
    data: readCsv("Regions.csv").map((r) => {
      const c = wkt(r.Centroid);
      return { id: int(r.Id)!, name: reqS(r.Name), nameAr: s(r.NameAr), code: s(r.Code), description: s(r.Description), latitude: c.lat, longitude: c.lng };
    }),
  });

  await prisma.plantSpecies.createMany({
    data: readCsv("PlantSpecies.csv").map((r) => ({
      id: int(r.Id)!,
      scientificName: reqS(r.ScientificName),
      commonName: s(r.CommonName),
      commonNameAr: s(r.CommonNameAr),
      family: s(r.Family),
      genus: s(r.Genus),
      nativeStatus: NativeStatus(r.NativeStatus),
      habitat: Habitat(r.Habitat),
      floweringSeason: Flowering(r.FloweringSeason),
      floweringMonths: s(r.FloweringMonths),
      isAllergenic: bool(r.IsAllergenic),
      allergenicNotes: s(r.AllergenicNotes),
      isBeeForage: bool(r.IsBeeForage),
      isCultivationTarget: bool(r.IsCultivationTarget),
      description: s(r.Description),
      references: s(r.References),
      imagePath: s(r.ImagePath),
      createdAt: reqDate(r.CreatedAt),
    })),
  });

  await prisma.pollenType.createMany({
    data: readCsv("PollenTypes.csv").map((r) => ({
      id: int(r.Id)!,
      name: reqS(r.Name),
      plantSpeciesId: int(r.PlantSpeciesId)!,
      sizeMicronsMin: num(r.SizeMicronsMin),
      sizeMicronsMax: num(r.SizeMicronsMax),
      shape: Shape(r.Shape),
      apertures: Aperture(r.Apertures),
      surface: Surface(r.Surface),
      diagnosticFeatures: s(r.DiagnosticFeatures),
      morphologyNotes: s(r.MorphologyNotes),
      references: s(r.References),
      primaryImagePath: s(r.PrimaryImagePath),
      status: Status(r.Status),
      createdAt: reqDate(r.CreatedAt),
      submittedAt: date(r.SubmittedAt),
      reviewedAt: date(r.ReviewedAt),
      reviewNote: s(r.ReviewNote),
    })),
  });

  await prisma.trapDevice.createMany({
    data: readCsv("TrapDevices.csv").map((r) => ({
      id: int(r.Id)!,
      serialNumber: reqS(r.SerialNumber),
      model: s(r.Model),
      latitude: num(r.Latitude),
      longitude: num(r.Longitude),
      locationName: s(r.LocationName),
      regionId: int(r.RegionId),
      status: TrapStatus(r.Status),
      installedAt: date(r.InstalledAt),
      lastMaintenance: date(r.LastMaintenance),
      isSolarPowered: bool(r.IsSolarPowered),
      hasWeatherSensors: bool(r.HasWeatherSensors),
      notes: s(r.Notes),
    })),
  });

  await prisma.airborneSample.createMany({
    data: readCsv("AirborneSamples.csv").map((r) => ({
      id: int(r.Id)!,
      trapDeviceId: int(r.TrapDeviceId)!,
      sampledFrom: reqDate(r.SampledFrom),
      sampledTo: reqDate(r.SampledTo),
      volumeM3: num(r.VolumeM3),
      notes: s(r.Notes),
      createdAt: reqDate(r.CreatedAt),
    })),
  });

  await prisma.pollenRecord.createMany({
    data: readCsv("PollenRecords.csv").map((r) => ({
      id: int(r.Id)!,
      code: reqS(r.Code),
      pollenTypeId: int(r.PollenTypeId)!,
      plantSpeciesId: int(r.PlantSpeciesId),
      regionId: int(r.RegionId),
      latitude: num(r.Latitude),
      longitude: num(r.Longitude),
      locationName: s(r.LocationName),
      collectedOn: reqDate(r.CollectedOn),
      year: int(r.Year),
      month: int(r.Month),
      season: s(r.Season),
      source: Source(r.Source),
      notes: s(r.Notes),
      status: Status(r.Status),
      createdAt: reqDate(r.CreatedAt),
      validatedAt: date(r.ValidatedAt),
      rejectionReason: s(r.RejectionReason),
    })),
  });

  await prisma.airborneSamplePollenCount.createMany({
    data: readCsv("AirborneSamplePollenCounts.csv").map((r) => ({
      id: int(r.Id)!,
      airborneSampleId: int(r.AirborneSampleId)!,
      pollenTypeId: int(r.PollenTypeId)!,
      countGrains: intD(r.CountGrains, 0),
      grainsPerCubicMeter: num(r.GrainsPerCubicMeter),
    })),
  });

  await prisma.airQualityReading.createMany({
    data: readCsv("AirQualityReadings.csv").map((r) => ({
      id: int(r.Id)!,
      measuredAt: reqDate(r.MeasuredAt),
      latitude: num(r.Latitude),
      longitude: num(r.Longitude),
      stationName: s(r.StationName),
      regionId: int(r.RegionId),
      pm25: num(r.Pm25),
      pm10: num(r.Pm10),
      tempC: num(r.TempC),
      humidityPct: num(r.HumidityPct),
      windSpeedMs: num(r.WindSpeedMs),
      windDirectionDeg: num(r.WindDirectionDeg),
      rainfallMm: num(r.RainfallMm),
      dustEvent: bool(r.DustEvent),
      source: s(r.Source),
    })),
  });

  await prisma.beehive.createMany({
    data: readCsv("Beehives.csv").map((r) => ({
      id: int(r.Id)!,
      name: reqS(r.Name),
      owner: s(r.Owner),
      latitude: num(r.Latitude),
      longitude: num(r.Longitude),
      locationName: s(r.LocationName),
      regionId: int(r.RegionId),
      colonies: int(r.Colonies),
      isActive: bool(r.IsActive),
      installedAt: date(r.InstalledAt),
      lastMovedAt: date(r.LastMovedAt),
      notes: s(r.Notes),
      createdAt: reqDate(r.CreatedAt),
    })),
  });

  await prisma.pollenImage.createMany({
    data: readCsv("PollenImages.csv").map((r) => ({
      id: int(r.Id)!,
      pollenTypeId: int(r.PollenTypeId)!,
      pollenRecordId: int(r.PollenRecordId),
      filePath: reqS(r.FilePath),
      caption: s(r.Caption),
      microscope: Microscope(r.Microscope),
      magnification: num(r.Magnification),
      stain: s(r.Stain),
      annotations: s(r.Annotations),
      isValidated: bool(r.IsValidated),
      uploadedAt: reqDate(r.UploadedAt),
    })),
  });

  await prisma.validationLog.createMany({
    data: readCsv("ValidationLogs.csv").map((r) => ({
      id: int(r.Id)!,
      pollenRecordId: int(r.PollenRecordId)!,
      fromStatus: Status(r.FromStatus),
      toStatus: Status(r.ToStatus),
      actorId: s(r.ActorId),
      comment: s(r.Comment),
      changedAt: reqDate(r.ChangedAt),
    })),
  });

  // 3. Resync identity sequences to MAX(id) (we inserted explicit PKs).
  const tables = [
    "Region", "PlantSpecies", "PollenType", "TrapDevice", "AirborneSample",
    "PollenRecord", "AirborneSamplePollenCount", "AirQualityReading", "Beehive",
    "PollenImage", "ValidationLog",
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${t}"','id'), (SELECT COALESCE(MAX(id), 1) FROM "${t}"))`,
    );
  }

  // 4. Report.
  const [regions, species, types, records, logs, images, air, samples, counts, traps, hives] = await Promise.all([
    prisma.region.count(),
    prisma.plantSpecies.count(),
    prisma.pollenType.count(),
    prisma.pollenRecord.count(),
    prisma.validationLog.count(),
    prisma.pollenImage.count(),
    prisma.airQualityReading.count(),
    prisma.airborneSample.count(),
    prisma.airborneSamplePollenCount.count(),
    prisma.trapDevice.count(),
    prisma.beehive.count(),
  ]);
  const published = await prisma.pollenRecord.count({ where: { status: "Published" } });
  console.log(
    `Imported Atlas data: ${regions} regions, ${species} species, ${types} pollen types, ` +
      `${records} records (${published} published), ${logs} validation logs, ${images} images, ` +
      `${air} air readings, ${samples} airborne samples, ${counts} pollen counts, ${traps} traps, ${hives} beehives.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
