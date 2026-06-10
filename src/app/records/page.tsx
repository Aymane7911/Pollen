import Link from "next/link";
import { prisma } from "@/lib/db";
import { humanize } from "@/lib/enums";
import { PageHead, StatusBadge } from "@/components/PageHead";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Pollen Records · UAE Pollen Atlas" };

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ regionId?: string; year?: string; q?: string }>;
}) {
  const { regionId, year, q } = await searchParams;
  const query = (q ?? "").trim();

  const where: Prisma.PollenRecordWhereInput = { status: "Published" };
  if (regionId) where.regionId = Number(regionId);
  if (year) where.year = Number(year);

  const [all, regions] = await Promise.all([
    prisma.pollenRecord.findMany({
      where,
      include: { pollenType: true, region: true },
      orderBy: { collectedOn: "desc" },
      take: 500,
    }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
  ]);

  // SQLite `contains` is case-sensitive, so filter code / location in JS.
  const needle = query.toLowerCase();
  const records = needle
    ? all.filter(
        (r) =>
          r.code.toLowerCase().includes(needle) ||
          (r.locationName ?? "").toLowerCase().includes(needle),
      )
    : all;

  return (
    <>
      <PageHead
        eyebrow="Field data"
        title="Pollen Records"
        subtitle="Published pollen collection records across the UAE."
      />

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <form method="get" className="flex items-center gap-2 mb-3 flex-wrap">
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
          <input
            type="number"
            name="year"
            defaultValue={year ?? ""}
            placeholder="Year"
            className="pa-input"
            style={{
              width: "7rem",
              padding: ".45rem .75rem",
              border: "1px solid var(--pa-line)",
              borderRadius: "var(--pa-radius-sm)",
              background: "var(--pa-surface)",
              fontSize: ".9rem",
              color: "var(--pa-ink)",
            }}
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search code or location…"
            className="pa-input"
            style={{
              flex: "1 1 auto",
              maxWidth: "22rem",
              padding: ".45rem .75rem",
              border: "1px solid var(--pa-line)",
              borderRadius: "var(--pa-radius-sm)",
              background: "var(--pa-surface)",
              fontSize: ".9rem",
              color: "var(--pa-ink)",
            }}
          />
          <button type="submit" className="pa-btn pa-btn-primary">
            <i className="bi bi-funnel" /> Filter
          </button>
          {(regionId || year || query) && (
            <Link href="/records" className="pa-btn pa-btn-outline">
              Clear
            </Link>
          )}
        </form>

        <div className="pa-card">
          <div className="pa-card-header">
            <div>
              <span className="pa-card-eyebrow">Records</span>
              <h2>Published collection records</h2>
            </div>
            <span className="pa-pill pa-pill-mute">{records.length}</span>
          </div>
          {records.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-card-list" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">No pollen records found</div>
              <p className="text-sm text-mute">
                {regionId || year || query
                  ? "Nothing matches the current filters. Try widening your search."
                  : "There are no published records yet."}
              </p>
            </div>
          ) : (
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Pollen type</th>
                  <th>Region</th>
                  <th>Collected</th>
                  <th>Season</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.code}</td>
                    <td className="text-sm">{r.pollenType.name}</td>
                    <td className="text-sm">{r.region?.name ?? "—"}</td>
                    <td className="font-mono text-xs">{r.collectedOn.toISOString().slice(0, 10)}</td>
                    <td className="text-sm">{humanize(r.season)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
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
