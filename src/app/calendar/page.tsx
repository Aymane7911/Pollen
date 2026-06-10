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
        subtitle="When each species flowers — the basis of pollen prediction."
      />

      <div className="mx-auto max-w-7xl px-4 pa-content">
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
              <div className="pa-empty-title">No species in the calendar</div>
              <p className="text-sm text-mute">The catalogue is empty.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="pa-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "14rem" }}>Species</th>
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
      </div>
    </>
  );
}
