import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic PRNG so reseeding produces the same demo dataset.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260607);
const jitter = (v: number, amt: number) => v + (rand() - 0.5) * amt;
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const parseMonths = (csv: string) => csv.split(",").map((s) => parseInt(s.trim(), 10));

async function main() {
  // Idempotent reseed: clear in FK-safe order.
  await prisma.airborneSamplePollenCount.deleteMany();
  await prisma.airborneSample.deleteMany();
  await prisma.pollenImage.deleteMany();
  await prisma.pollenRecord.deleteMany();
  await prisma.airQualityReading.deleteMany();
  await prisma.beehive.deleteMany();
  await prisma.trapDevice.deleteMany();
  await prisma.pollenType.deleteMany();
  await prisma.plantSpecies.deleteMany();
  await prisma.region.deleteMany();

  // ---- Regions (centroids from the original SeedData) ----
  const regionData = [
    { name: "Abu Dhabi", nameAr: "أبوظبي", code: "AUH", latitude: 24.4539, longitude: 54.3773, description: "Largest emirate; desert, coastal, and protected areas." },
    { name: "Dubai", nameAr: "دبي", code: "DXB", latitude: 25.2048, longitude: 55.2708, description: "Coastal urban emirate." },
    { name: "Sharjah", nameAr: "الشارقة", code: "SHJ", latitude: 25.3463, longitude: 55.4033, description: "Coastal and east-coast (Khor Fakkan, Kalba)." },
    { name: "Ajman", nameAr: "عجمان", code: "AJM", latitude: 25.4111, longitude: 55.5136 },
    { name: "Umm Al Quwain", nameAr: "أم القيوين", code: "UAQ", latitude: 25.5641, longitude: 55.6033 },
    { name: "Ras Al Khaimah", nameAr: "رأس الخيمة", code: "RAK", latitude: 25.7895, longitude: 55.9432, description: "Mountains, wadis, coast, and agricultural plains." },
    { name: "Fujairah", nameAr: "الفجيرة", code: "FUJ", latitude: 25.1288, longitude: 56.3265, description: "East coast, mountains, and wadis." },
  ];
  const regions: Record<string, { id: number; latitude: number; longitude: number }> = {};
  for (const r of regionData) {
    const rec = await prisma.region.create({ data: r });
    regions[r.code] = { id: rec.id, latitude: r.latitude, longitude: r.longitude };
  }

  // ---- Plant species (10 core, with §10 audience flags) ----
  const speciesData = [
    { scientificName: "Phoenix dactylifera", commonName: "Date Palm", commonNameAr: "نخيل التمر", family: "Arecaceae", genus: "Phoenix", nativeStatus: "Native", habitat: "Agricultural", floweringSeason: "Spring", floweringMonths: "2,3,4", isAllergenic: true, allergenicNotes: "Significant local allergen during spring pollination.", isCultivationTarget: true, description: "Cultivated date palm; the UAE's signature agricultural crop." },
    { scientificName: "Prosopis cineraria", commonName: "Ghaf", commonNameAr: "غاف", family: "Fabaceae", genus: "Prosopis", nativeStatus: "Native", habitat: "Desert", floweringSeason: "Spring", floweringMonths: "3,4,5", isBeeForage: true, description: "National tree of the UAE; important desert bee forage." },
    { scientificName: "Acacia tortilis", commonName: "Umbrella Thorn", commonNameAr: "سمر", family: "Fabaceae", genus: "Acacia", nativeStatus: "Native", habitat: "Desert", floweringSeason: "Variable", floweringMonths: "2,3,4,9,10", isBeeForage: true, description: "Iconic flat-topped desert acacia; valued acacia-honey source." },
    { scientificName: "Avicennia marina", commonName: "Grey Mangrove", commonNameAr: "قرم", family: "Acanthaceae", genus: "Avicennia", nativeStatus: "Native", habitat: "Mangrove", floweringSeason: "Summer", floweringMonths: "5,6,7,8", isBeeForage: true, description: "Sole native mangrove; supports coastal mangrove honey." },
    { scientificName: "Calotropis procera", commonName: "Apple of Sodom", commonNameAr: "عشار", family: "Apocynaceae", genus: "Calotropis", nativeStatus: "Native", habitat: "Desert", floweringSeason: "YearRound", floweringMonths: "1,2,3,4,5,6,7,8,9,10,11,12" },
    { scientificName: "Ziziphus spina-christi", commonName: "Christ's Thorn Jujube", commonNameAr: "سدر", family: "Rhamnaceae", genus: "Ziziphus", nativeStatus: "Native", habitat: "Wadi", floweringSeason: "Autumn", floweringMonths: "9,10,11", isBeeForage: true, isCultivationTarget: true, description: "Major source of premium Sidr honey." },
    { scientificName: "Salvadora persica", commonName: "Toothbrush Tree", commonNameAr: "أراك", family: "Salvadoraceae", genus: "Salvadora", nativeStatus: "Native", habitat: "Coastal", floweringSeason: "Winter", floweringMonths: "12,1,2" },
    { scientificName: "Tamarix aphylla", commonName: "Athel Tamarisk", commonNameAr: "أثل", family: "Tamaricaceae", genus: "Tamarix", nativeStatus: "Native", habitat: "Coastal", floweringSeason: "Variable", floweringMonths: "3,4,5,6" },
    { scientificName: "Chenopodium album", commonName: "Lamb's Quarters", commonNameAr: "سرمق", family: "Amaranthaceae", genus: "Chenopodium", nativeStatus: "Introduced", habitat: "Urban", floweringSeason: "Variable", floweringMonths: "3,4,5,6,7,8,9,10", isAllergenic: true, allergenicNotes: "Common urban allergen." },
    { scientificName: "Conocarpus lancifolius", commonName: "Damas", commonNameAr: "دامس", family: "Combretaceae", genus: "Conocarpus", nativeStatus: "Cultivated", habitat: "Urban", floweringSeason: "Spring", floweringMonths: "3,4,5", isAllergenic: true, allergenicNotes: "Widely planted urban tree; reported allergen." },
  ];
  const species: Record<string, { id: number; months: number[] }> = {};
  for (const s of speciesData) {
    const rec = await prisma.plantSpecies.create({ data: s });
    species[s.scientificName] = { id: rec.id, months: parseMonths(s.floweringMonths) };
  }

  // ---- Pollen types (one per species) ----
  const typeData = [
    { sci: "Phoenix dactylifera", min: 18, max: 25, shape: "Spheroidal", apertures: "Monosulcate", surface: "Reticulate", diag: "Single distal sulcus; reticulate ornamentation; small–medium grain.", status: "Published" },
    { sci: "Prosopis cineraria", min: 25, max: 35, shape: "Spheroidal", apertures: "Tricolporate", surface: "Psilate", diag: "Tricolporate, psilate to scabrate; polyad clumps occur.", status: "Published" },
    { sci: "Acacia tortilis", min: 30, max: 50, shape: "Spheroidal", apertures: "Other", surface: "Psilate", diag: "Dispersed as 16-grain polyads (Mimosoideae).", status: "Published" },
    { sci: "Avicennia marina", min: 25, max: 32, shape: "Oblate", apertures: "Tricolporate", surface: "Reticulate", diag: "Tricolporate, coarsely reticulate — Acanthaceae.", status: "Validated" },
    { sci: "Calotropis procera", min: 40, max: 60, shape: "Other", apertures: "Other", surface: "Psilate", diag: "Pollen shed in pollinia (Apocynaceae).", status: "Published" },
    { sci: "Ziziphus spina-christi", min: 22, max: 30, shape: "Subprolate", apertures: "Tricolporate", surface: "Striate", diag: "Tricolporate, striate ornamentation, sub-prolate.", status: "Published" },
    { sci: "Salvadora persica", min: 18, max: 24, shape: "Spheroidal", apertures: "Tricolpate", surface: "Reticulate", diag: "Tricolpate, micro-reticulate.", status: "Published" },
    { sci: "Tamarix aphylla", min: 18, max: 25, shape: "Spheroidal", apertures: "Tricolporate", surface: "Reticulate", diag: "Small tricolporate, reticulate.", status: "Published" },
    { sci: "Chenopodium album", min: 20, max: 28, shape: "Spheroidal", apertures: "Polyporate", surface: "Scabrate", diag: "Pantoporate (~40–80 pores), scabrate — the 'Cheno-Am' grain.", status: "Published" },
    { sci: "Conocarpus lancifolius", min: 18, max: 24, shape: "Spheroidal", apertures: "Tricolporate", surface: "Psilate", diag: "Tricolporate, small, near-spherical.", status: "Validated" },
  ];
  const types: { id: number; name: string; speciesId: number; months: number[] }[] = [];
  for (const t of typeData) {
    const sp = species[t.sci];
    const name = `${t.sci} pollen`;
    const rec = await prisma.pollenType.create({
      data: {
        name, plantSpeciesId: sp.id, sizeMicronsMin: t.min, sizeMicronsMax: t.max,
        shape: t.shape, apertures: t.apertures, surface: t.surface,
        diagnosticFeatures: t.diag, status: t.status,
        morphologyNotes: "Family/genus-typical morphology from palynological literature.",
      },
    });
    types.push({ id: rec.id, name, speciesId: sp.id, months: sp.months });
  }

  // ---- Beehives (§10.5 mobile apiaries) ----
  await prisma.beehive.createMany({
    data: [
      { name: "Wadi Ghaf Apiary", owner: "Al Dhaid Beekeepers Co-op", regionId: regions.SHJ.id, locationName: "Al Dhaid", latitude: 25.288, longitude: 55.881, colonies: 40, isActive: true, installedAt: new Date("2026-02-10"), lastMovedAt: new Date("2026-03-18"), notes: "Spring placement near Ghaf and Acacia forage." },
      { name: "Hatta Mountain Hives", owner: "Hatta Honey", regionId: regions.DXB.id, locationName: "Hatta", latitude: 24.8, longitude: 56.13, colonies: 25, isActive: true, installedAt: new Date("2026-01-05"), lastMovedAt: new Date("2026-04-02") },
      { name: "Wadi Wurayah Sidr Site", owner: "Fujairah Apiaries", regionId: regions.FUJ.id, locationName: "Wadi Wurayah", latitude: 25.401, longitude: 56.27, colonies: 60, isActive: true, installedAt: new Date("2025-10-12"), lastMovedAt: new Date("2026-05-01"), notes: "Positioned for the autumn Sidr (Ziziphus) flow." },
      { name: "RAK Plains Winter Camp", owner: "Northern Emirates Honey", regionId: regions.RAK.id, locationName: "Digdaga", latitude: 25.69, longitude: 55.93, colonies: 18, isActive: false, installedAt: new Date("2025-11-20"), lastMovedAt: new Date("2026-02-28"), notes: "Relocated after the winter forage ended." },
    ],
  });

  // ---- Air-quality readings (one recent per region; Ajman has a dust event) ----
  const airByRegion: Record<string, { pm25: number; pm10: number; dust: boolean; wdir: number; wspd: number }> = {
    AUH: { pm25: 44.7, pm10: 137.3, dust: false, wdir: 315, wspd: 4.2 },
    DXB: { pm25: 38.1, pm10: 92.0, dust: false, wdir: 300, wspd: 3.6 },
    SHJ: { pm25: 41.5, pm10: 110.4, dust: false, wdir: 290, wspd: 3.1 },
    AJM: { pm25: 88.2, pm10: 168.5, dust: true, wdir: 202, wspd: 6.4 },
    UAQ: { pm25: 33.0, pm10: 71.2, dust: false, wdir: 280, wspd: 2.8 },
    RAK: { pm25: 29.4, pm10: 64.8, dust: false, wdir: 45, wspd: 3.9 },
    FUJ: { pm25: 22.1, pm10: 51.0, dust: false, wdir: 120, wspd: 4.7 },
  };
  // 30 days of history per region so the Insights time-series has data.
  const today = new Date("2026-06-05T14:00:00");
  for (const [code, reg] of Object.entries(regions)) {
    const a = airByRegion[code];
    for (let d = 29; d >= 0; d--) {
      const when = new Date(today.getTime() - d * 86400000);
      const isLatest = d === 0;
      await prisma.airQualityReading.create({
        data: {
          measuredAt: when, regionId: reg.id, latitude: reg.latitude, longitude: reg.longitude,
          stationName: `${code} reference station`,
          pm25: Math.max(5, a.pm25 + jitter(0, 18)),
          pm10: Math.max(10, (isLatest ? a.pm10 : a.pm10 + jitter(0, 40))),
          tempC: 30 + jitter(0, 8), humidityPct: 45 + jitter(0, 30),
          windSpeedMs: Math.max(0, a.wspd + jitter(0, 2)), windDirectionDeg: a.wdir,
          dustEvent: isLatest ? a.dust : rand() < 0.1, source: "Seed demo",
        },
      });
    }
  }

  // ---- Pollen records (published demo set across regions/years/flowering months) ----
  const regionCodes = Object.keys(regions);
  const years = [2024, 2025, 2026];
  let counter = 0;
  const records: {
    code: string; pollenTypeId: number; plantSpeciesId: number; regionId: number;
    latitude: number; longitude: number; locationName: string; collectedOn: Date;
    year: number; month: number; season: string; source: string; status: string;
  }[] = [];
  const seasonOf = (m: number) => (m <= 2 || m === 12 ? "Winter" : m <= 5 ? "Spring" : m <= 8 ? "Summer" : "Autumn");
  for (const t of types) {
    for (const year of years) {
      // 2–3 flowering months per type/year
      const months = [...t.months].sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 2));
      for (const m of months) {
        // 1–2 regions per month
        const n = 1 + Math.floor(rand() * 2);
        for (let i = 0; i < n; i++) {
          const code = pick(regionCodes);
          const reg = regions[code];
          counter++;
          const day = 1 + Math.floor(rand() * 27);
          records.push({
            code: `PA-${year}${String(m).padStart(2, "0")}-${String(counter).padStart(5, "0")}`,
            pollenTypeId: t.id, plantSpeciesId: t.speciesId, regionId: reg.id,
            latitude: jitter(reg.latitude, 0.35), longitude: jitter(reg.longitude, 0.35),
            locationName: `${code} field site ${i + 1}`,
            collectedOn: new Date(year, m - 1, day), year, month: m,
            season: seasonOf(m), source: "FieldPlantSample", status: "Published",
          });
        }
      }
    }
  }
  await prisma.pollenRecord.createMany({ data: records });

  // ---- Trap devices + airborne samples + counts (Insights aerobiology) ----
  const trapSpecs = [
    { serial: "TRAP-AUH-01", model: "Hirst 7-day", code: "AUH", lat: 24.46, lng: 54.38 },
    { serial: "TRAP-SHJ-01", model: "Hirst 7-day", code: "SHJ", lat: 25.35, lng: 55.40 },
  ];
  for (const ts of trapSpecs) {
    const reg = regions[ts.code];
    const trap = await prisma.trapDevice.create({
      data: {
        serialNumber: ts.serial, model: ts.model, regionId: reg.id, latitude: ts.lat, longitude: ts.lng,
        locationName: `${ts.code} rooftop station`, status: "Active", installedAt: new Date("2025-09-01"),
        isSolarPowered: true, hasWeatherSensors: true,
      },
    });
    for (let mo = 0; mo < 8; mo++) {
      const start = new Date(2025, 9, 1); // Oct 2025 onward, one sampling week per month
      start.setMonth(start.getMonth() + mo);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const sample = await prisma.airborneSample.create({
        data: { trapDeviceId: trap.id, sampledFrom: start, sampledTo: end, volumeM3: 10 + jitter(0, 2) },
      });
      const chosen = [...types].sort(() => rand() - 0.5).slice(0, 3);
      for (const ct of chosen) {
        const grains = Math.floor(rand() * 180) + 5;
        await prisma.airborneSamplePollenCount.create({
          data: { airborneSampleId: sample.id, pollenTypeId: ct.id, countGrains: grains, grainsPerCubicMeter: grains / 10 },
        });
      }
    }
  }

  const [nSpecies, nTypes, nRecords, nAir, nHives, nTraps] = await Promise.all([
    prisma.plantSpecies.count(), prisma.pollenType.count(), prisma.pollenRecord.count(),
    prisma.airQualityReading.count(), prisma.beehive.count(), prisma.trapDevice.count(),
  ]);
  console.log(`Seeded: ${regionData.length} regions, ${nSpecies} species, ${nTypes} pollen types, ${nRecords} records, ${nAir} air readings, ${nHives} beehives, ${nTraps} traps.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
