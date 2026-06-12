import Link from "next/link";
import { prisma } from "@/lib/db";
import { humanize } from "@/lib/enums";
import { PageHead } from "@/components/PageHead";
import { Ar } from "@/components/Ar";

export const metadata = { title: "Plants · UAE Pollen Atlas" };

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function floweringMonths(csv: string | null | undefined): string {
  if (!csv) return "";
  return csv
    .split(",")
    .map((p) => MONTHS[Number(p.trim())] ?? "")
    .filter(Boolean)
    .join(" · ");
}

export default async function SpeciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // SQLite `contains` is case-sensitive, so fetch all (catalogue-sized) ordered
  // and filter case-insensitively in JS to keep search intuitive.
  const all = await prisma.plantSpecies.findMany({
    orderBy: { scientificName: "asc" },
    include: { _count: { select: { pollenTypes: true } } },
  });

  const needle = query.toLowerCase();
  const species = needle
    ? all.filter(
        (s) =>
          s.scientificName.toLowerCase().includes(needle) ||
          (s.commonName ?? "").toLowerCase().includes(needle) ||
          (s.commonNameAr ?? "").includes(query) ||
          (s.family ?? "").toLowerCase().includes(needle),
      )
    : all;

  return (
    <>
      <PageHead
        eyebrow="Catalogue"
        title="Plants"
        subtitle="Flora of the UAE recorded in the atlas — habitat, flowering season, allergenicity, bee-forage and cultivation value."
      />

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <form method="get" className="flex items-center gap-2 mb-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search scientific, common, Arabic name, or family…"
            className="pa-input"
            style={{
              flex: "1 1 auto",
              maxWidth: "26rem",
              padding: ".45rem .75rem",
              border: "1px solid var(--pa-line)",
              borderRadius: "var(--pa-radius-sm)",
              background: "var(--pa-surface)",
              fontSize: ".9rem",
              color: "var(--pa-ink)",
            }}
          />
          <button type="submit" className="pa-btn pa-btn-primary">
            <i className="bi bi-search" /> Search
          </button>
          {query && (
            <Link href="/species" className="pa-btn pa-btn-outline">
              Clear
            </Link>
          )}
        </form>

        <div className="pa-card">
          {species.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-tree" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">No plants found</div>
              <p className="text-sm text-mute">
                {query ? (
                  <>
                    Nothing matches <strong>“{query}”</strong>. Try a different term.
                  </>
                ) : (
                  "The catalogue is empty."
                )}
              </p>
            </div>
          ) : (
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Scientific name</th>
                  <th>Common name</th>
                  <th>Family</th>
                  <th>Habitat</th>
                  <th>Flowering</th>
                  <th>Traits</th>
                </tr>
              </thead>
              <tbody>
                {species.map((s) => {
                  const months = floweringMonths(s.floweringMonths);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/species/${s.id}`} style={{ fontStyle: "italic", fontWeight: 600 }}>
                          {s.scientificName}
                        </Link>
                        {s._count.pollenTypes > 0 && (
                          <span className="pa-pill pa-pill-mute" style={{ marginLeft: ".4rem" }}>
                            <i className="bi bi-circle-fill" style={{ fontSize: ".55rem" }} /> {s._count.pollenTypes}
                          </span>
                        )}
                      </td>
                      <td className="text-sm">{s.commonName ?? "—"} <Ar text={s.commonNameAr} className="text-xs text-mute" style={{ marginInlineStart: ".4rem" }} /></td>
                      <td className="text-sm">{s.family ?? "—"}</td>
                      <td className="text-sm">{humanize(s.habitat)}</td>
                      <td className="text-sm">
                        {humanize(s.floweringSeason)}
                        {months && <span className="text-xs text-mute"> · {months}</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 flex-wrap">
                          {s.isAllergenic && (
                            <span className="pa-pill pa-pill-amber">
                              <i className="bi bi-exclamation-triangle" /> Allergenic
                            </span>
                          )}
                          {s.isBeeForage && (
                            <span className="pa-pill pa-pill-amber">
                              <i className="bi bi-hexagon-fill" /> Bee forage
                            </span>
                          )}
                          {s.isCultivationTarget && (
                            <span className="pa-pill pa-pill-info">
                              <i className="bi bi-flower3" /> Cultivation
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
