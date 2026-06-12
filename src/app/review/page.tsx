import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireValidate } from "@/lib/auth";
import { PageHead, StatusBadge } from "@/components/PageHead";

export const metadata = { title: "Review queue · UAE Pollen Atlas" };

const QUEUE = ["Submitted", "UnderReview", "Validated", "Rejected"];
const ALL = ["Draft", "Submitted", "UnderReview", "Validated", "Rejected", "Published"];

export default async function ReviewPage() {
  await requireValidate();

  const [records, counts] = await Promise.all([
    prisma.pollenRecord.findMany({
      where: { status: { in: QUEUE } },
      include: { pollenType: true, region: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 500,
    }),
    prisma.pollenRecord.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countMap = new Map(counts.map((c) => [c.status, c._count._all]));

  return (
    <>
      <PageHead eyebrow="Validation" title="Review queue" subtitle="Records moving through the validation pipeline" />
      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {ALL.map((s) => (
            <span key={s} className="flex items-center gap-1 text-sm">
              <StatusBadge status={s} /> <span className="font-mono text-xs text-mute">{countMap.get(s) ?? 0}</span>
            </span>
          ))}
        </div>

        <div className="pa-card">
          {records.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-clipboard-check" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">Queue is empty</div>
              <p className="text-sm text-mute">No records are awaiting review.</p>
            </div>
          ) : (
            <table className="pa-table">
              <thead>
                <tr><th>Code</th><th>Pollen type</th><th>Region</th><th>Collected</th><th style={{ textAlign: "right" }}>Status</th></tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/records/${r.id}`} style={{ fontWeight: 600 }}>{r.code}</Link></td>
                    <td>{r.pollenType.name}</td>
                    <td>{r.region?.name ?? "—"}</td>
                    <td className="font-mono text-xs">{r.collectedOn.toISOString().slice(0, 10)}</td>
                    <td style={{ textAlign: "right" }}><StatusBadge status={r.status} /></td>
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
