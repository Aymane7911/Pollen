import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canContribute } from "@/lib/roles";

// Port of MapController.Records. No auth in this build, so the public rule
// applies: only Published records are returned. Supports region/type/year
// filters plus the §10 audience forage filter (bee | cultivation).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const user = await getCurrentUser();
  const where: Prisma.PollenRecordWhereInput = {
    latitude: { not: null },
    longitude: { not: null },
    // Contributors see every status on the map; the public sees only Published.
    ...(canContribute(user?.role) ? {} : { status: "Published" }),
  };
  const regionId = sp.get("regionId");
  const pollenTypeId = sp.get("pollenTypeId");
  const year = sp.get("year");
  const forage = sp.get("forage");
  if (regionId) where.regionId = Number(regionId);
  if (pollenTypeId) where.pollenTypeId = Number(pollenTypeId);
  if (year) where.year = Number(year);
  if (forage === "bee") where.pollenType = { plantSpecies: { isBeeForage: true } };
  else if (forage === "cultivation") where.pollenType = { plantSpecies: { isCultivationTarget: true } };

  const rows = await prisma.pollenRecord.findMany({
    where,
    take: 2000,
    include: { pollenType: { include: { plantSpecies: true } }, region: true },
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.pollenType.name,
      species: r.pollenType.plantSpecies?.scientificName ?? "",
      region: r.region?.name ?? null,
      location: r.locationName,
      collectedOn: r.collectedOn.toISOString().slice(0, 10),
      status: r.status,
      beeForage: r.pollenType.plantSpecies?.isBeeForage ?? false,
      cultivationTarget: r.pollenType.plantSpecies?.isCultivationTarget ?? false,
      lat: r.latitude,
      lng: r.longitude,
      kind: "record",
    }))
  );
}
