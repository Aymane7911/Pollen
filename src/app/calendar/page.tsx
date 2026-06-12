import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHead } from "@/components/PageHead";

export const metadata = { title: "Flowering Calendar · UAE Pollen Atlas" };
export const dynamic = "force-dynamic"; // highlights the live current month

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function floweringSet(csv: string | null | undefined): Set<number> {
  const set = new Set<number>();
  if (!csv) return set;
  for (const part of csv.split(",")) {
    const n = parseInt(part.trim(), 10);
    if (n >= 1 && n <= 12) set.add(n);
  }
  return set;
}

export default async function CalendarPage() {
  const species = await prisma.plantSpecies.findMany({ orderBy: { scientificName: "asc" } });
  const currentMonth = new Date().getMonth() + 1;

  return (
    <>
      <PageHead
        eyebrow="Phenology"
        title="Flowering Calendar"
        subtitle="When each plant flowers — the basis of pollen prediction."
      />

      <div className="mx-auto max-w-7xl px-4 pa-content">
        {/* How to read it */}
        <div className="pa-card" style={{ padding: "1rem 1.15rem", marginBottom: "1rem", borderLeft: "3px solid var(--pa-primary)" }}>
          <div className="flex items-start gap-3">
            <i className="bi bi-info-circle" style={{ color: "var(--pa-primary)", fontSize: "1.2rem", marginTop: ".1rem" }} />
            <div className="text-sm" style={{ color: "var(--pa-ink-soft)", lineHeight: 1.6 }}>
              <strong>How to read this calendar.</strong>{" "}Each row is a plant and the twelve columns are the months
              (Jan&nbsp;→&nbsp;Dec). A coloured cell means that plant is <strong>in flower</strong> that month —
              <span style={{ color: "var(--pa-primary)", fontWeight: 600 }}> green</span> for most plants and
              <span style={{ color: "#7a5b13", fontWeight: 600 }}> amber</span> for <strong>allergenic</strong>{" "}ones
              (worth watching if you have hay&nbsp;fever). The shaded column is the <strong>current month</strong>.
              Tip: tap a plant&apos;s name to open its profile.
              <div className="text-xs text-mute" style={{ marginTop: ".4rem" }}>
                Why it matters: the flowering calendar lets the Atlas predict which pollen could be in the air
                <em> before</em> it is even sampled at a trap.
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 flex-wrap text-sm">
          <span className="flex items-center gap-2">
            <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 4, background: "var(--pa-primary)" }} />
            Flowering
          </span>
          <span className="flex items-center gap-2">
            <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 4, background: "var(--pa-accent)" }} />
            Allergenic flowering
          </span>
          <span className="flex items-center gap-2">
            <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: 4, background: "var(--pa-primary-tint)", border: "1px solid var(--pa-primary-light)" }} />
            Current month ({MONTH_NAMES[currentMonth - 1]})
          </span>
        </div>

        <div className="pa-card">
          {species.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-calendar3" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">No plants in the calendar</div>
              <p className="text-sm text-mute">The catalogue is empty.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="pa-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "14rem" }}>Plant</th>
                    {MONTHS.map((m, i) => {
                      const month = i + 1;
                      const isCurrent = month === currentMonth;
                      return (
                        <th
                          key={i}
                          title={MONTH_NAMES[i]}
                          style={{
                            textAlign: "center",
                            minWidth: "2rem",
                            ...(isCurrent
                              ? { background: "var(--pa-primary-tint)", color: "var(--pa-primary-dark)" }
                              : {}),
                          }}
                        >
                          {m}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {species.map((s) => {
                    const months = floweringSet(s.floweringMonths);
                    return (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/species/${s.id}`} style={{ fontStyle: "italic", fontWeight: 600 }}>
                            {s.scientificName}
                          </Link>
                          {s.commonName && (
                            <span className="text-xs text-mute"> · {s.commonName}</span>
                          )}
                        </td>
                        {MONTHS.map((_, i) => {
                          const month = i + 1;
                          const flowers = months.has(month);
                          const isCurrent = month === currentMonth;
                          return (
                            <td
                              key={i}
                              style={{
                                padding: ".3rem .35rem",
                                ...(isCurrent ? { background: "var(--pa-primary-tint)" } : {}),
                              }}
                            >
                              {flowers && (
                                <span
                                  title={`${s.scientificName} flowers in ${MONTH_NAMES[i]}`}
                                  style={{
                                    display: "block",
                                    height: 18,
                                    borderRadius: 4,
                                    background: s.isAllergenic ? "var(--pa-accent)" : "var(--pa-primary)",
                                  }}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-xs text-mute mt-3" style={{ lineHeight: 1.6 }}>
          <i className="bi bi-database" /> Built from each plant&apos;s recorded flowering months; the underlying phenology
          is curated per region and carried forward each year. Data shown is illustrative.
        </p>
      </div>
    </>
  );
}
