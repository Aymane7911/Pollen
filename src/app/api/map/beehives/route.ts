import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Port of MapController.Beehives (§10.5 mobile apiaries).
export async function GET() {
  const rows = await prisma.beehive.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    orderBy: { isActive: "desc" },
    take: 2000,
    include: { region: true },
  });
  return NextResponse.json(
    rows.map((b) => ({
      id: b.id,
      name: b.name,
      owner: b.owner,
      region: b.region?.name ?? null,
      location: b.locationName,
      colonies: b.colonies,
      active: b.isActive,
      lastMoved: b.lastMovedAt ? b.lastMovedAt.toISOString().slice(0, 10) : null,
      lat: b.latitude,
      lng: b.longitude,
      kind: "beehive",
    }))
  );
}
