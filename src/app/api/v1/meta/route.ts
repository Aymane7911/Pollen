import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public API §v1 — service metadata + catalogue counts.
export const dynamic = "force-dynamic";

export async function GET() {
  const [species, pollenTypes, publishedRecords, regions, beehives] = await Promise.all([
    prisma.plantSpecies.count(),
    prisma.pollenType.count(),
    prisma.pollenRecord.count({ where: { status: "Published" } }),
    prisma.region.count(),
    prisma.beehive.count(),
  ]);

  return NextResponse.json({
    name: "UAE Pollen Atlas API",
    version: "v1",
    counts: { species, pollenTypes, publishedRecords, regions, beehives },
  });
}
