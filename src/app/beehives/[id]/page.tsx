import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHead, BackLink } from "@/components/PageHead";
import { requireContribute } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireContribute();
  const { id } = await params;
  const hive = await prisma.beehive.findUnique({
    where: { id: Number.isInteger(Number(id)) ? Number(id) : -1 },
    include: { region: true },
  });

  if (!hive) notFound();

  return (
    <>
      <PageHead eyebrow={hive.owner ?? "Apiary"} title={hive.name} subtitle={hive.region?.name}>
        <BackLink href="/beehives" />
        {hive.isActive ? (
          <span className="pa-pill">
            <i className="bi bi-hexagon-fill" /> Active
          </span>
        ) : (
          <span className="pa-pill pa-pill-mute">Inactive</span>
        )}
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="pa-card">
          <div className="pa-card-header">
            <div>
              <span className="pa-card-eyebrow">Apiary site</span>
              <h2>{hive.name}</h2>
            </div>
            <span className="pa-pill pa-pill-info">
              <i className="bi bi-hexagon-fill" /> Mobile site
            </span>
          </div>
          <div className="pa-card-body">
            <dl className="pa-dl">
              <dt>Owner</dt>
              <dd>{hive.owner ?? "—"}</dd>
              <dt>Region</dt>
              <dd>{hive.region?.name ?? "—"}</dd>
              <dt>Colonies</dt>
              <dd>{hive.colonies ?? "—"}</dd>
              <dt>Coords</dt>
              <dd>
                {hive.latitude != null && hive.longitude != null
                  ? `${hive.latitude.toFixed(5)}, ${hive.longitude.toFixed(5)}`
                  : "—"}
              </dd>
              <dt>Placed on</dt>
              <dd>{hive.installedAt?.toISOString().slice(0, 10) ?? "—"}</dd>
              <dt>Last moved</dt>
              <dd>{hive.lastMovedAt?.toISOString().slice(0, 10) ?? "—"}</dd>
            </dl>

            <p className="text-xs text-mute" style={{ marginTop: "1rem", lineHeight: 1.6 }}>
              <i className="bi bi-info-circle" /> Beehives are mobile — they are relocated to follow seasonal forage,
              so the plotted point reflects the apiary&apos;s current position rather than a fixed location.
            </p>

            {hive.notes && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--pa-line-soft)", paddingTop: "1rem" }}>
                <div className="pa-card-eyebrow" style={{ marginBottom: ".4rem" }}>
                  Notes
                </div>
                <p className="text-sm" style={{ margin: 0, color: "var(--pa-ink-soft)", lineHeight: 1.6 }}>
                  {hive.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
