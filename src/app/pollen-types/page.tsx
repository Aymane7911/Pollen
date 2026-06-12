import Link from "next/link";
import { prisma } from "@/lib/db";
import { humanize, ValidationStatus } from "@/lib/enums";
import { getCurrentUser } from "@/lib/auth";
import { canContribute } from "@/lib/roles";
import { PageHead, StatusBadge } from "@/components/PageHead";

export const metadata = { title: "Pollen Types · UAE Pollen Atlas" };

function sizeRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  return `${min ?? "—"}–${max ?? "—"} µm`;
}

export default async function PollenTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getCurrentUser();
  const isContrib = canContribute(user?.role);
  const active = ValidationStatus.includes(status as ValidationStatus) ? status : undefined;

  // Public sees only Published/Validated; contributors may filter across all statuses.
  const types = await prisma.pollenType.findMany({
    where: isContrib ? (active ? { status: active } : undefined) : { status: { in: ["Published", "Validated"] } },
    orderBy: { name: "asc" },
    include: { plantSpecies: true },
  });

  return (
    <>
      <PageHead
        eyebrow="Catalogue"
        title="Pollen Types"
        subtitle="Morphological reference types in the atlas."
      >
        {isContrib && (
          <form method="get" className="flex items-center gap-2">
            <select
              name="status"
              defaultValue={active ?? ""}
              className="pa-btn pa-btn-outline"
              style={{ fontWeight: 500 }}
            >
              <option value="">All statuses</option>
              {ValidationStatus.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </select>
            <button type="submit" className="pa-btn pa-btn-primary">
              <i className="bi bi-funnel" /> Filter
            </button>
          </form>
        )}
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="pa-card">
          {types.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-circle" style={{ fontSize: "1.8rem", color: "var(--pa-mute)" }} />
              <div className="pa-empty-title">No pollen types found</div>
              <p className="text-sm text-mute">
                {active ? "No types match this status filter." : "The catalogue is empty."}
              </p>
            </div>
          ) : (
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Plant</th>
                  <th>Size</th>
                  <th>Shape</th>
                  <th>Apertures</th>
                  <th>Surface</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/pollen-types/${t.id}`} style={{ fontWeight: 600 }}>
                        {t.name}
                      </Link>
                    </td>
                    <td className="text-sm" style={{ fontStyle: "italic", color: "var(--pa-mute)" }}>
                      {t.plantSpecies.scientificName}
                    </td>
                    <td className="font-mono text-sm">{sizeRange(t.sizeMicronsMin, t.sizeMicronsMax)}</td>
                    <td className="text-sm">{humanize(t.shape)}</td>
                    <td className="text-sm">{humanize(t.apertures)}</td>
                    <td className="text-sm">{humanize(t.surface)}</td>
                    <td>
                      <StatusBadge status={t.status} />
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
