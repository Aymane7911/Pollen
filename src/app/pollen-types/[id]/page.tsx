import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { humanize, MicroscopeType } from "@/lib/enums";
import { getCurrentUser } from "@/lib/auth";
import { canContribute, canValidate } from "@/lib/roles";
import { uploadPollenImage } from "@/lib/upload-actions";
import { PageHead, StatusBadge, BackLink } from "@/components/PageHead";
import { Field, TextInput, Select } from "@/components/form";

function sizeRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  return `${min ?? "—"}–${max ?? "—"} µm`;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const type = await prisma.pollenType.findUnique({
    where: { id: Number.isInteger(Number(id)) ? Number(id) : -1 },
    include: { plantSpecies: true, images: { orderBy: { id: "asc" } } },
  });

  if (!type) notFound();

  const user = await getCurrentUser();
  // Non-Published types are visible only to validators or the creator (not the public).
  if (type.status !== "Published" && !canValidate(user?.role) && type.createdById !== user?.id) notFound();
  const canUpload = !!user?.isApproved && canContribute(user.role);

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
              {type.primaryImagePath && (
                <img
                  src={type.primaryImagePath}
                  alt={type.name}
                  style={{ width: "100%", maxHeight: 340, objectFit: "contain", borderRadius: "var(--pa-radius-sm)", border: "1px solid var(--pa-line)", background: "#faf9f6", marginBottom: "1rem" }}
                />
              )}
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
                <dt>Linked plant</dt>
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

        {type.images.length > 0 && (
          <div className="pa-card mt-3">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Microscopy</span>
                <h2>Pollen images</h2>
              </div>
              <span className="pa-pill pa-pill-mute">{type.images.length}</span>
            </div>
            <div className="pa-card-body">
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {type.images.map((img) => (
                  <figure key={img.id} style={{ margin: 0 }}>
                    <img
                      src={img.filePath}
                      alt={img.caption ?? type.name}
                      style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "var(--pa-radius-sm)", border: "1px solid var(--pa-line)", background: "#faf9f6" }}
                    />
                    {img.caption && (
                      <figcaption className="text-xs text-mute" style={{ marginTop: ".3rem" }}>
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </div>
        )}

        {canUpload && (
          <div className="pa-card mt-3" style={{ maxWidth: 520 }}>
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">Contribute</span><h2>Upload image</h2></div></div>
            <div className="pa-card-body">
              <form action={uploadPollenImage}>
                <input type="hidden" name="pollenTypeId" value={type.id} />
                <Field label="Image file" hint="jpg / png / webp / tif">
                  <TextInput type="file" name="file" accept="image/*" required />
                </Field>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Caption" hint="optional"><TextInput name="caption" /></Field>
                  <Field label="Microscope"><Select name="microscope" defaultValue="LightMicroscopy">{MicroscopeType.map((o) => <option key={o}>{o}</option>)}</Select></Field>
                </div>
                <button type="submit" className="pa-btn pa-btn-primary"><i className="bi bi-upload" /> Upload image</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
