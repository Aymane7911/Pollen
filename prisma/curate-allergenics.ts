// Curate clinical allergen weights (0–4) and taxon-specific airborne concentration
// thresholds (grains/m³) by plant family — grounding the risk index in EAACI/EAN practice
// instead of one generic scale for every pollen. Idempotent; re-runnable any time.
import { prisma } from "../src/lib/db";

type Profile = { weight: number; mod: number; high: number; vhigh: number };

// Family → clinical profile. Thresholds are literature-informed (EAACI/EAN), adjusted for
// the arid-zone taxa that dominate the UAE.
const FAMILY: Record<string, Profile> = {
  Poaceae:        { weight: 4, mod: 10, high: 30, vhigh: 80 },  // grasses — highly potent
  Amaranthaceae:  { weight: 4, mod: 10, high: 30, vhigh: 80 },  // Cheno-Am — major arid-zone allergen
  Chenopodiaceae: { weight: 4, mod: 10, high: 30, vhigh: 80 },
  Oleaceae:       { weight: 4, mod: 20, high: 50, vhigh: 150 }, // olive
  Asteraceae:     { weight: 3, mod: 10, high: 30, vhigh: 90 },  // mugwort / ragweed family
  Arecaceae:      { weight: 3, mod: 15, high: 50, vhigh: 150 }, // date palm — large grains, locally significant
  Fabaceae:       { weight: 3, mod: 15, high: 40, vhigh: 120 }, // Prosopis (ghaf), Acacia
  Combretaceae:   { weight: 3, mod: 10, high: 40, vhigh: 100 }, // Conocarpus (damas) — notorious Gulf urban allergen
  Cupressaceae:   { weight: 3, mod: 20, high: 60, vhigh: 200 },
  Tamaricaceae:   { weight: 2, mod: 15, high: 50, vhigh: 150 },
  Urticaceae:     { weight: 2, mod: 20, high: 80, vhigh: 200 },
};
const DEFAULT: Profile = { weight: 2, mod: 10, high: 50, vhigh: 150 };

async function main() {
  const species = await prisma.plantSpecies.findMany({
    where: { isAllergenic: true },
    select: { id: true, family: true },
  });
  for (const s of species) {
    const p = (s.family && FAMILY[s.family]) || DEFAULT;
    await prisma.plantSpecies.update({ where: { id: s.id }, data: { allergenWeight: p.weight } });
  }

  const types = await prisma.pollenType.findMany({
    where: { plantSpecies: { isAllergenic: true } },
    select: { id: true, plantSpecies: { select: { family: true } } },
  });
  for (const t of types) {
    const p = (t.plantSpecies?.family && FAMILY[t.plantSpecies.family]) || DEFAULT;
    await prisma.pollenType.update({
      where: { id: t.id },
      data: { thresholdModerate: p.mod, thresholdHigh: p.high, thresholdVeryHigh: p.vhigh },
    });
  }
  console.log(`Curated ${species.length} allergenic plants (weights) and ${types.length} pollen types (thresholds).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
