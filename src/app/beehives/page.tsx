import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHead } from "@/components/PageHead";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Apiaries · UAE Pollen Atlas" };

export default async function BeehivesPage({
  searchParams,
}: {
  searchParams: Promise<{ active?: string; regionId?: string }>;
}) {
  const { active, regionId } = await searchParams;

  const where: Prisma.BeehiveWhereInput = {};
  if (active === "true") where.isActive = true;
  else if (active === "false") where.isActive = false;
  if (regionId) where.regionId = Number(regionId);

  const [hives, regions] = await Promise.all([
    prisma.beehive.findMany({
      where,
      include: { region: true },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHead
        eyebrow="Beekeeping"
        title="Apiaries"
        subtitle="Mobile beehive sites and their current locations."
      >
        <Link href="/map" className="pa-btn pa-btn-outline">
          <i className="bi bi-geo-alt" /> View on map
        </Link>
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <form method="get" className="flex items-center gap-2 mb-3 flex-wrap">
          <select
            name="active"
            defaultValue={active ?? ""}
            className="pa-input"
            style={{
              padding: ".45rem .75rem",
              border: "1px solid var(--pa-line)",
              borderRadius: "var(--pa-radius-sm)",
              background: "var(--pa-surface)",
              fontSize: ".9rem",
              color: "var(--pa-ink)",
            }}
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            name="regionId"
            defaultValue={regionId ?? ""}
            className="pa-input"
            style={{
              padding: ".45rem .75rem",
              border: "1px solid var(--pa-line)",
              borderRadius: "var(--pa-radius-sm)",
              background: "var(--pa-surface)",
              fontSize: ".9rem",
              color: "var(--pa-ink)",
            }}
          >
            <option value="">All regions</option>
            {regions.map((rg) => (
              <option key={rg.id} value={rg.id}>
                {rg.name}
              </option>
            ))}
          </select>
          <button type="submit" className="pa-btn pa-btn-primary">
            <i className="bi bi-funnel" /> Filter
          </button>
          {(active || regionId) && (
            <Link href="/beehives" className="pa-btn pa-btn-outline">
              Clear
            </Link>
          )}
        </form>

        <div className="pa-card">
          <div className="pa-card-header">
            <div>
              <span className="pa-card-eyebrow">Apiaries</span>
              <h2>Beehive sites</h2>
            </div>
            <span className="pa-pill pa-pill-mute">{hives.length}</span>
          </div>
          {hives.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-hexagon" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">No apiaries found</div>
              <p className="text-sm text-mute">
                {active || regionId
                  ? "Nothing matches the current filters. Try widening your search."
                  : "No beehive sites have been registered yet."}
              </p>
            </div>
          ) : (
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Apiary</th>
                  <th>Owner</th>
                  <th>Region</th>
                  <th>Colonies</th>
                  <th>Status</th>
                  <th>Last moved</th>
                </tr>
              </thead>
              <tbody>
                {hives.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <Link href={`/beehives/${h.id}`} style={{ fontWeight: 600 }}>
                        {h.name}
                      </Link>
                    </td>
                    <td className="text-sm">{h.owner ?? "—"}</td>
                    <td className="text-sm">{h.region?.name ?? "—"}</td>
                    <td className="font-mono text-xs">{h.colonies ?? "—"}</td>
                    <td>
                      {h.isActive ? (
                        <span className="pa-pill">
                          <i className="bi bi-hexagon-fill" /> Active
                        </span>
                      ) : (
                        <span className="pa-pill pa-pill-mute">Inactive</span>
                      )}
                    </td>
                    <td className="font-mono text-xs">{h.lastMovedAt?.toISOString().slice(0, 10) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
