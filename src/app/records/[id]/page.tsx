import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { humanize } from "@/lib/enums";
import { getCurrentUser, requireContribute } from "@/lib/auth";
import { canValidate } from "@/lib/roles";
import { allowedTransitions } from "@/lib/workflow";
import { transitionRecord } from "@/lib/workflow-actions";
import { PageHead, StatusBadge, BackLink } from "@/components/PageHead";
import { Field, TextArea } from "@/components/form";

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireContribute();
  const record = await prisma.pollenRecord.findUnique({
    where: { id: Number.isInteger(Number(id)) ? Number(id) : -1 },
    include: {
      pollenType: true,
      plantSpecies: true,
      region: true,
      images: { orderBy: { id: "asc" } },
      validationLogs: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!record) notFound();

  const user = await getCurrentUser();
  const isOwner = !!user && record.collectorId === user.id;
  const canReview = canValidate(user?.role);
  if (record.status !== "Published" && !(canReview || isOwner)) notFound();

  const transitions = user?.isApproved
    ? allowedTransitions(record.status).filter((t) => (t.need === "validate" ? canReview : isOwner || record.collectorId === null))
    : [];

  return (
    <>
      <PageHead eyebrow="Pollen record" title={record.code} subtitle={record.pollenType.name}>
        <StatusBadge status={record.status} />
        <BackLink href="/records" />
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)" }}>
          <div className="flex flex-col gap-3">
            <div className="pa-card">
              <div className="pa-card-header">
                <div><span className="pa-card-eyebrow">Observation</span><h2>Record details</h2></div>
              </div>
              <div className="pa-card-body">
                <dl className="pa-dl">
                  <dt>Pollen type</dt>
                  <dd><Link href={`/pollen-types/${record.pollenTypeId}`}>{record.pollenType.name}</Link></dd>
                  <dt>Plant</dt>
                  <dd>{record.plantSpecies ? <Link href={`/species/${record.plantSpeciesId}`} style={{ fontStyle: "italic" }}>{record.plantSpecies.scientificName}</Link> : "—"}</dd>
                  <dt>Region</dt><dd>{record.region?.name ?? "—"}</dd>
                  <dt>Location</dt>
                  <dd>
                    {record.locationName ?? "—"}
                    {record.latitude != null && record.longitude != null && (
                      <span className="text-mute font-mono text-xs"> · {record.latitude.toFixed(3)}, {record.longitude.toFixed(3)}</span>
                    )}
                  </dd>
                  <dt>Collected</dt>
                  <dd>{record.collectedOn.toISOString().slice(0, 10)}{record.season && <span className="text-mute"> · {record.season}</span>}</dd>
                  <dt>Source</dt><dd>{humanize(record.source)}</dd>
                  <dt>Collector</dt><dd>{record.collectorName ?? "—"}</dd>
                  {record.notes && (<><dt>Notes</dt><dd>{record.notes}</dd></>)}
                  {record.rejectionReason && (<><dt>Rejection</dt><dd style={{ color: "#8c2832" }}>{record.rejectionReason}</dd></>)}
                </dl>
              </div>
            </div>

            {transitions.length > 0 && (
              <div className="pa-card">
                <div className="pa-card-header">
                  <div><span className="pa-card-eyebrow">Workflow</span><h2>Actions</h2></div>
                </div>
                <div className="pa-card-body">
                  <form action={transitionRecord} className="flex flex-col gap-2">
                    <input type="hidden" name="recordId" value={record.id} />
                    <Field label="Comment" hint="recorded in the audit trail">
                      <TextArea name="comment" rows={2} placeholder="Optional note for this transition…" />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      {transitions.map((t) => (
                        <button key={t.to} type="submit" name="toStatus" value={t.to} className={`pa-btn ${t.to === "Rejected" ? "pa-btn-outline" : "pa-btn-primary"}`}>
                          <i className={`bi ${t.icon}`} /> {t.label}
                        </button>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {record.images.length > 0 && (
              <div className="pa-card">
                <div className="pa-card-header"><div><span className="pa-card-eyebrow">Microscopy</span><h2>Images</h2></div><span className="pa-pill pa-pill-mute">{record.images.length}</span></div>
                <div className="pa-card-body">
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                    {record.images.map((img) => (
                      <img key={img.id} src={img.filePath} alt={img.caption ?? record.code} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "var(--pa-radius-sm)", border: "1px solid var(--pa-line)", background: "#faf9f6" }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audit trail timeline (the ValidationLog history) */}
          <div className="pa-card" style={{ alignSelf: "start" }}>
            <div className="pa-card-header">
              <div><span className="pa-card-eyebrow">Audit trail</span><h2>Status history</h2></div>
              <span className="pa-pill pa-pill-mute">{record.validationLogs.length}</span>
            </div>
            <div className="pa-card-body">
              {record.validationLogs.length === 0 ? (
                <div className="pa-empty">No status changes recorded</div>
              ) : (
                <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {record.validationLogs.map((log) => (
                    <li key={log.id} style={{ borderLeft: "2px solid var(--pa-line)", paddingLeft: "1rem", paddingBottom: "1.1rem", position: "relative" }}>
                      <span style={{ position: "absolute", left: -5, top: 5, width: 8, height: 8, borderRadius: "50%", background: "var(--pa-primary)" }} />
                      <div className="text-sm flex items-center gap-1 flex-wrap">
                        <StatusBadge status={log.fromStatus} />
                        <i className="bi bi-arrow-right" style={{ fontSize: ".7rem", color: "var(--pa-mute)" }} />
                        <StatusBadge status={log.toStatus} />
                      </div>
                      <div className="text-xs text-mute" style={{ marginTop: ".3rem" }}>
                        {log.actorName ?? "Legacy import"} · {log.changedAt.toISOString().slice(0, 16).replace("T", " ")}
                      </div>
                      {log.comment && <div className="text-sm" style={{ marginTop: ".3rem", color: "var(--pa-ink-soft)" }}>{log.comment}</div>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
