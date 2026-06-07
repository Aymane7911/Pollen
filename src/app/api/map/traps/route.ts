import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Port of MapController.Traps.
export async function GET() {
  const rows = await prisma.trapDevice.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    take: 2000,
    include: { region: true },
  });
  return NextResponse.json(
    rows.map((t) => ({
      id: t.id,
      serial: t.serialNumber,
      model: t.model,
      region: t.region?.name ?? null,
      status: t.status,
      location: t.locationName,
      lat: t.latitude,
      lng: t.longitude,
      kind: "trap",
    }))
  );
}
