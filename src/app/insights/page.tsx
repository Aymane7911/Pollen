import { prisma } from "@/lib/db";
import { PageHead } from "@/components/PageHead";
import { humanize } from "@/lib/enums";
import InsightsCharts from "./InsightsCharts";

export const metadata = { title: "Insights · UAE Pollen Atlas" };
export const dynamic = "force-dynamic"; // live aggregates from the DB

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function tally<T>(src: T[], key: (t: T) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const x of src) {
    const k = key(x);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, value]) => ({ name: humanize(name), value })).sort((a, b) => b.value - a.value);
}

export default async function InsightsPage() {
  const [types, species, records, air, counts] = await Promise.all([
    prisma.pollenType.findMany(),
    prisma.plantSpecies.findMany(),
    prisma.pollenRecord.findMany(),
    prisma.airQualityReading.findMany({ orderBy: { measuredAt: "desc" }, take: 30 }),
    prisma.airborneSamplePollenCount.findMany({ include: { airborneSample: true } }),
  ]);

  const byAperture = tally(types, (t) => t.apertures);
  const byShape = tally(types, (t) => t.shape);
  const byStatus = tally(records, (r) => r.status);
  const byFamily = tally(species.filter((s) => s.family), (s) => s.family!).slice(0, 10);

  const recordsByMonth = MONTHS.map((name, i) => ({
    name,
    value: records.filter((r) => r.month === i + 1).length,
  }));

  air.reverse();
  const airSeries = air.map((a) => ({
    date: a.measuredAt.toISOString().slice(5, 10),
    pm25: a.pm25 ? Math.round(a.pm25) : null,
    pm10: a.pm10 ? Math.round(a.pm10) : null,
  }));

  const grains = new Array(12).fill(0);
  for (const c of counts) grains[c.airborneSample.sampledFrom.getMonth()] += c.countGrains;
  const grainsByMonth = MONTHS.map((name, i) => ({ name, value: grains[i] }));

  const stats = [
    { label: "Plant species", value: species.length },
    { label: "Pollen types", value: types.length },
    { label: "Records", value: records.length },
    { label: "Allergenic species", value: species.filter((s) => s.isAllergenic).length },
    { label: "Plant families", value: new Set(species.filter((s) => s.family).map((s) => s.family)).size },
    { label: "Bee-forage species", value: species.filter((s) => s.isBeeForage).length },
  ];

  return (
    <>
      <PageHead eyebrow="Analytics" title="Catalogue Insights" subtitle="Morphology composition, family coverage, record activity, and aerobiology trends." />
      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          {stats.map((s) => (
            <div key={s.label} className="pa-stat">
              <div className="pa-stat-num">{s.value}</div>
              <div className="pa-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <InsightsCharts
          recordsByMonth={recordsByMonth}
          byAperture={byAperture}
          byShape={byShape}
          byStatus={byStatus}
          byFamily={byFamily}
          airSeries={airSeries}
          grainsByMonth={grainsByMonth}
        />
      </div>
    </>
  );
}
