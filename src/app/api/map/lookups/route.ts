import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Port of MapController.Lookups — region + pollen-type options for the filters.
export async function GET() {
  const [regions, types] = await Promise.all([
    prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.pollenType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return NextResponse.json({ regions, types });
}
