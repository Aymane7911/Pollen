import { prisma } from "./db";
import { computeForecast } from "./risk";
import { plumeBearing, radiusKm, halfAngleDeg } from "./risk-geometry";

// Port of PollenAtlas/Services/AlertService.cs — the §9 decision-support engine. Turns the
// combined pollen + air-quality risk into alerts for authorities/hospitals, each carrying a
// wind-directional affected area. Dispatch is recorded on the alert; real email/SMS delivery
// is out of scope for this read-only build (the Atlas SMS sender was log-only too), so the
// dispatch log records who *would* be notified.

const shortName = (n: string) => n.replace("-type pollen", "").replace(" pollen", "").trim();

/** Evaluate every active rule against current per-region risk; raise + record an alert
 *  wherever the threshold is crossed and no live alert exists within the rule cooldown.
 *  Returns the number of alerts raised. */
export async function evaluateAlerts(): Promise<number> {
  const rules = await prisma.alertRule.findMany({ where: { isActive: true } });
  if (rules.length === 0) return 0;

  const regions = await prisma.region.findMany();
  const recipients = await prisma.alertRecipient.findMany({ where: { isActive: true } });
  let raised = 0;

  for (const region of regions) {
    const applicable = rules.filter((r) => r.regionId == null || r.regionId === region.id);
    if (applicable.length === 0) continue;

    const f = await computeForecast(region.id);

    for (const rule of applicable) {
      if (f.riskScore < rule.minScore) continue;

      // Dedupe: skip if a non-resolved alert for this rule+region exists within cooldown.
      const since = new Date(Date.now() - rule.cooldownHours * 3_600_000);
      const live = await prisma.alert.count({
        where: {
          regionId: region.id, alertRuleId: rule.id,
          raisedAt: { gte: since }, status: { not: "Resolved" },
        },
      });
      if (live > 0) continue;

      const drivers = f.inSeason.slice(0, 3).map((t) =>
        t.measured ? `${shortName(t.type)} ${Math.round(t.grainsPerM3!)}/m³` : shortName(t.type),
      );
      const windFrom = f.latestAir?.windDirectionDeg ?? null;
      const windSpeed = f.latestAir?.windSpeedMs ?? null;

      const bearingDeg = windFrom != null ? plumeBearing(windFrom) : null;
      const half = windFrom != null ? halfAngleDeg(windSpeed) : 180;
      const radius = radiusKm(windSpeed); // radiusKm(null) = 5 km when no wind

      // Dispatch targets: subscribed Public are always warned, plus the rule's official
      // channels — scoped to the region or all-regions.
      const kinds: string[] = ["Public"];
      if (rule.notifyAuthorities) kinds.push("Authority");
      if (rule.notifyHospitals) kinds.push("Hospital");
      const targets = recipients.filter(
        (r) => kinds.includes(r.kind) && (r.regionId == null || r.regionId === region.id),
      );
      const log = targets.flatMap((r) => {
        const lines: string[] = [];
        if (r.email) lines.push(`email → ${r.name} <${r.email}>`);
        if (r.phone) lines.push(`sms → ${r.name} (${r.phone})`);
        return lines;
      });

      await prisma.alert.create({
        data: {
          alertRuleId: rule.id,
          regionId: region.id,
          riskLevel: f.riskLevel,
          riskScore: f.riskScore,
          summary:
            `${region.name}: ${f.riskLevel} pollen-allergy risk (score ${f.riskScore}). ` +
            `${f.riskNote}. Drivers: ${drivers.join(", ")}.`,
          recommendedActions: rule.recommendedActions,
          originLat: region.latitude,
          originLng: region.longitude,
          windFromDeg: windFrom,
          windSpeedMs: windSpeed,
          bearingDeg,
          halfAngleDeg: half,
          radiusKm: radius,
          status: "Sent",
          recipientCount: targets.length,
          dispatchLog: log.length ? log.join("\n") : "No matching active recipients.",
        },
      });
      raised++;
    }
  }
  return raised;
}

/** Seed a sensible default rule + demo recipients (Atlas AlertRule defaults: MinScore 8)
 *  so the alert pipeline and the map plume layer have data to show. Idempotent. */
export async function seedDefaultAlertConfig(): Promise<void> {
  if ((await prisma.alertRule.count()) === 0) {
    await prisma.alertRule.create({
      data: {
        name: "UAE high-risk pollen alert",
        minScore: 8,
        notifyAuthorities: true,
        notifyHospitals: true,
        cooldownHours: 24,
        recommendedActions:
          "Advise sensitive groups to limit outdoor exposure; hospitals to expect elevated " +
          "respiratory presentations; consider pausing dust-generating industrial activity downwind.",
      },
    });
  }
  if ((await prisma.alertRecipient.count()) === 0) {
    await prisma.alertRecipient.createMany({
      data: [
        { name: "Sample Municipality Authority", kind: "Authority", email: "authority@example.ae" },
        { name: "Sample Regional Hospital", kind: "Hospital", email: "hospital@example.ae" },
      ],
    });
  }
}
