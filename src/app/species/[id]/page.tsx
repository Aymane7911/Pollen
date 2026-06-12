import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { humanize } from "@/lib/enums";
import { PageHead, StatusBadge, BackLink } from "@/components/PageHead";
import { Ar } from "@/components/Ar";

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function floweringMonths(csv: string | null | undefined): string {
  if (!csv) return "";
  return csv
    .split(",")
    .map((p) => MONTHS[Number(p.trim())] ?? "")
    .filter(Boolean)
    .join(", ");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const species = await prisma.plantSpecies.findUnique({
    where: { id: Number.isInteger(Number(id)) ? Number(id) : -1 },
    include: { pollenTypes: { where: { status: { in: ["Published", "Validated"] } }, orderBy: { name: "asc" } } },
  });

  if (!species) notFound();

  const subtitleParts = [species.commonName, species.commonNameAr].filter(Boolean);
  const months = floweringMonths(species.floweringMonths);
  const references = (species.references ?? "")
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <>
      <PageHead
        eyebrow={species.family ?? "Plant"}
        title={species.scientificName}
        subtitle={subtitleParts.length ? subtitleParts.join(" · ") : undefined}
      >
        <BackLink href="/species" />
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}>
          {/* ── Left: taxonomy + ecology ── */}
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Taxonomy &amp; ecology</span>
                <h2 style={{ fontStyle: "italic" }}>{species.scientificName}</h2>
              </div>
            </div>
            <div className="pa-card-body">
              {species.imagePath && (
                <img
                  src={species.imagePath}
                  alt={species.scientificName}
                  style={{ width: "100%", maxHeight: 280, objectFit: "contain", borderRadius: "var(--pa-radius-sm)", border: "1px solid var(--pa-line)", background: "#faf9f6", marginBottom: "1rem" }}
                />
              )}
              <dl className="pa-dl">
                <dt>Common name</dt>
                <dd>{species.commonName ?? "—"} <Ar text={species.commonNameAr} className="text-mute" style={{ marginInlineStart: ".4rem" }} /></dd>
                <dt>Genus</dt>
                <dd>{species.genus ?? "—"}</dd>
                <dt>Family</dt>
                <dd>{species.family ?? "—"}</dd>
                <dt>Native status</dt>
                <dd>{humanize(species.nativeStatus)}</dd>
                <dt>Habitat</dt>
                <dd>{humanize(species.habitat)}</dd>
                <dt>Flowering season</dt>
                <dd>
                  {humanize(species.floweringSeason)}
                  {months && <span className="text-mute"> · {months}</span>}
                </dd>
                <dt>Traits</dt>
                <dd>
                  <div className="flex items-center gap-1 flex-wrap">
                    {species.isAllergenic && (
                      <span className="pa-pill pa-pill-amber">
                        <i className="bi bi-exclamation-triangle" /> Allergenic
                      </span>
                    )}
                    {species.isBeeForage && (
                      <span className="pa-pill pa-pill-amber">
                        <i className="bi bi-hexagon-fill" /> Bee forage
                      </span>
                    )}
                    {species.isCultivationTarget && (
                      <span className="pa-pill pa-pill-info">
                        <i className="bi bi-flower3" /> Cultivation
                      </span>
                    )}
                    {!species.isAllergenic && !species.isBeeForage && !species.isCultivationTarget && (
                      <span className="text-mute text-sm">—</span>
                    )}
                  </div>
                </dd>
              </dl>

              {species.allergenicNotes && (
                <div
                  style={{
                    marginTop: "1rem",
                    background: "var(--pa-accent-soft)",
                    padding: ".8rem 1rem",
                    borderRadius: "var(--pa-radius-sm)",
                    fontSize: ".88rem",
                    color: "#7a5b13",
                  }}
                >
                  <strong>
                    <i className="bi bi-exclamation-triangle" /> Allergenicity
                  </strong>
                  <div style={{ marginTop: ".25rem" }}>{species.allergenicNotes}</div>
                </div>
              )}

              {species.description && (
                <p className="text-sm" style={{ marginTop: "1rem", color: "var(--pa-ink-soft)", lineHeight: 1.6 }}>
                  {species.description}
                </p>
              )}

              {references.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div className="pa-card-eyebrow" style={{ marginBottom: ".4rem" }}>
                    References
                  </div>
                  <ul className="text-xs text-mute" style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.7 }}>
                    {references.map((ref, i) => (
                      <li key={i}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: linked pollen types ── */}
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Palynology</span>
                <h2>Linked pollen types</h2>
              </div>
              <span className="pa-pill pa-pill-mute">{species.pollenTypes.length}</span>
            </div>
            <div className="pa-card-body">
              {species.pollenTypes.length === 0 ? (
                <div className="pa-empty" style={{ padding: "1.5rem 1rem" }}>
                  <i className="bi bi-circle" style={{ fontSize: "1.6rem", color: "var(--pa-primary-light)" }} />
                  <div className="pa-empty-title">No pollen types linked</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {species.pollenTypes.map((t) => (
                    <Link
                      key={t.id}
                      href={`/pollen-types/${t.id}`}
                      className="pa-card pa-card-hover"
                      style={{ padding: ".75rem .85rem" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="text-xs text-mute" style={{ marginTop: ".3rem" }}>
                        {humanize(t.shape)} · {humanize(t.apertures)}
                        {(t.sizeMicronsMin != null || t.sizeMicronsMax != null) && (
                          <>
                            {" · "}
                            {t.sizeMicronsMin ?? "?"}–{t.sizeMicronsMax ?? "?"} µm
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
