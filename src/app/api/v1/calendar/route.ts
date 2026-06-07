import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public API §v1 — flowering calendar (months parsed from the CSV into arrays).
export const dynamic = "force-dynamic";

function months(csv: string | null): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => n >= 1 && n <= 12);
}

export async function GET() {
  const species = await prisma.plantSpecies.findMany({ orderBy: { scientificName: "asc" } });
  return NextResponse.json(
    species.map((s) => ({
      species: s.scientificName,
      commonName: s.commonName,
      months: months(s.floweringMonths),
    })),
  );
}
