import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public API §v1 — plant species catalogue.
export const dynamic = "force-dynamic";

export async function GET() {
  const species = await prisma.plantSpecies.findMany({ orderBy: { scientificName: "asc" } });
  return NextResponse.json(
    species.map((s) => ({
      id: s.id,
      scientificName: s.scientificName,
      commonName: s.commonName,
      family: s.family,
      genus: s.genus,
      nativeStatus: s.nativeStatus,
      habitat: s.habitat,
      floweringSeason: s.floweringSeason,
      floweringMonths: s.floweringMonths,
      isAllergenic: s.isAllergenic,
      isBeeForage: s.isBeeForage,
      isCultivationTarget: s.isCultivationTarget,
    })),
  );
}
