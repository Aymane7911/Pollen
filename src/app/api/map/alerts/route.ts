import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { visual } from "@/lib/risk";
import { sectorPolygon } from "@/lib/risk-geometry";

// Port of MapController.Alerts — §9 wind-plume affected areas for the map. Each non-resolved
// alert becomes a downwind sector polygon (origin + radius + bearing + half-angle).
export async function GET() {
  const alerts = await prisma.alert.findMany({
    where: { status: { not: "Resolved" }, originLat: { not: null }, originLng: { not: null } },
    include: { region: true },
    orderBy: { raisedAt: "desc" },
    take: 500,
  });

  const out = alerts.map((a) => {
    const v = visual(a.riskLevel);
    return {
      id: a.id,
      region: a.region.name,
      level: a.riskLevel,
      score: a.riskScore,
      band: v.band,
      colorBg: v.bg,
      summary: a.summary,
      recommendedActions: a.recommendedActions,
      raisedAt: a.raisedAt,
      bearingDeg: a.bearingDeg,
      radiusKm: a.radiusKm,
      windFromDeg: a.windFromDeg,
      windSpeedMs: a.windSpeedMs,
      recipientCount: a.recipientCount,
      polygon: sectorPolygon(a.originLat!, a.originLng!, a.bearingDeg ?? 0, a.halfAngleDeg ?? 180, a.radiusKm ?? 5),
    };
  });
  return NextResponse.json(out);
}
