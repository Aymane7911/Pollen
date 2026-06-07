import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { humanize } from "@/lib/enums";
import { PageHead, StatusBadge, BackLink } from "@/components/PageHead";

function sizeRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  return `${min ?? "—"}–${max ?? "—"} µm`;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const type = await prisma.pollenType.findUnique({
    where: { id: Number(id) },
    include: { plantSpecies: true },
  });

  if (!type) notFound();

  const references = (type.references ?? "")
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <>
      <PageHead eyebrow="Pollen type" title={type.name} subtitle={type.plantSpecies.scientificName}>
        <BackLink href="/pollen-types" />
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}>
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Reference</span>
                <h2>Morphology</h2>
              </div>
            </div>
            <div className="pa-card-body">
              <dl className="pa-dl">
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={type.status} />
                </dd>
                <dt>Size</dt>
                <dd className="font-mono">{sizeRange(type.sizeMicronsMin, type.sizeMicronsMax)}</dd>
                <dt>Shape</dt>
                <dd>{humanize(type.shape)}</dd>
                <dt>Apertures</dt>
                <dd>{humanize(type.apertures)}</dd>
                <dt>Surface</dt>
                <dd>{humanize(type.surface)}</dd>
                <dt>Linked species</dt>
                <dd>
                  <Link href={`/species/${type.plantSpeciesId}`} style={{ fontStyle: "italic" }}>
                    {type.plantSpecies.scientificName}
                  </Link>
                </dd>
              </dl>

              {type.diagnosticFeatures && (
                <div className="mt-4">
                  <h3 className="font-serif" style={{ fontSize: "1rem", margin: "0 0 .35rem" }}>
                    Diagnostic features
                  </h3>
                  <p className="text-sm" style={{ margin: 0 }}>
                    {type.diagnosticFeatures}
                  </p>
                </div>
              )}

              {type.morphologyNotes && (
                <p className="text-xs text-mute mt-3" style={{ marginBottom: 0 }}>
                  {type.morphologyNotes}
                </p>
              )}
            </div>
          </div>

          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Literature</span>
                <h2>References</h2>
              </div>
            </div>
            <div className="pa-card-body">
              {references.length > 0 ? (
                <ul className="flex flex-col gap-2" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {references.map((r, i) => (
                    <li key={i} className="text-sm">
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="pa-empty">No references recorded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
