import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public API §v1 — published/validated pollen morphology types.
export const dynamic = "force-dynamic";

export async function GET() {
  const types = await prisma.pollenType.findMany({
    where: { status: { in: ["Published", "Validated"] } },
    include: { plantSpecies: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(
    types.map((t) => ({
      id: t.id,
      name: t.name,
      species: t.plantSpecies.scientificName,
      sizeMicronsMin: t.sizeMicronsMin,
      sizeMicronsMax: t.sizeMicronsMax,
      shape: t.shape,
      apertures: t.apertures,
      surface: t.surface,
      status: t.status,
    })),
  );
}
