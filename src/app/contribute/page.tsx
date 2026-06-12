import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireContribute } from "@/lib/auth";
import { PageHead, StatusBadge } from "@/components/PageHead";

export const metadata = { title: "Contribute · UAE Pollen Atlas" };

export default async function ContributePage() {
  const user = await requireContribute();
  const myRecords = await prisma.pollenRecord.findMany({
    where: { collectorId: user.id },
    include: { pollenType: true },
    orderBy: { id: "desc" },
    take: 100,
  });

  const cards = [
    { href: "/contribute/records/new", icon: "bi-card-list", title: "New pollen record", desc: "Field or trap observation → Draft" },
    { href: "/contribute/species/new", icon: "bi-tree", title: "New plant", desc: "Add reference flora" },
    { href: "/contribute/types/new", icon: "bi-circle-fill", title: "New pollen type", desc: "Morphology record → Draft" },
  ];

  return (
    <>
      <PageHead eyebrow="Contribute" title="Your contributions" subtitle={`Signed in as ${user.fullName}`}>
        <Link href="/contribute/records/new" className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> New record</Link>
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", marginBottom: "1rem" }}>
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="pa-card pa-card-hover" style={{ padding: "1rem" }}>
              <strong><i className={`bi ${c.icon}`} /> {c.title}</strong>
              <div className="text-sm text-mute" style={{ marginTop: ".25rem" }}>{c.desc}</div>
            </Link>
          ))}
        </div>

        <div className="pa-card">
          <div className="pa-card-header">
            <div><span className="pa-card-eyebrow">Your records</span><h2>My submissions</h2></div>
            <span className="pa-pill pa-pill-mute">{myRecords.length}</span>
          </div>
          {myRecords.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-card-list" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">No records yet</div>
              <p className="text-sm text-mute">Create a draft record to start the validation workflow.</p>
            </div>
          ) : (
            <table className="pa-table">
              <thead><tr><th>Code</th><th>Type</th><th>Collected</th><th style={{ textAlign: "right" }}>Status</th></tr></thead>
              <tbody>
                {myRecords.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/records/${r.id}`} style={{ fontWeight: 600 }}>{r.code}</Link></td>
                    <td>{r.pollenType.name}</td>
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
