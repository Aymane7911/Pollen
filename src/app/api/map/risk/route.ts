import { NextResponse } from "next/server";
import { computeRegionRisks } from "@/lib/risk";

// Port of MapController.Risk (§8 combined pollen + air-quality risk per region).
export async function GET() {
  return NextResponse.json(await computeRegionRisks());
}
