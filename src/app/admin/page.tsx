import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireManage } from "@/lib/auth";
import { PageHead } from "@/components/PageHead";

export const metadata = { title: "Admin · UAE Pollen Atlas" };

export default async function AdminPage() {
  await requireManage();
  const [users, pending, recordsByStatus, alerts, species, types] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailConfirmed: true, isApproved: false } }),
    prisma.pollenRecord.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.alert.count(),
    prisma.plantSpecies.count(),
    prisma.pollenType.count(),
  ]);
  const inReview = recordsByStatus
    .filter((r) => ["Submitted", "UnderReview", "Validated"].includes(r.status))
    .reduce((s, r) => s + r._count._all, 0);

  const tiles = [
    { label: "Users", value: users, href: "/admin/users", icon: "bi-people" },
    { label: "Pending approval", value: pending, href: "/admin/users", icon: "bi-person-check", accent: pending > 0 },
    { label: "In review queue", value: inReview, href: "/review", icon: "bi-clipboard-check" },
    { label: "Alerts", value: alerts, href: "/admin/alerts", icon: "bi-bell" },
    { label: "Plants", value: species, href: "/species", icon: "bi-tree" },
    { label: "Pollen types", value: types, href: "/pollen-types", icon: "bi-circle-fill" },
  ];

  const sections = [
    { href: "/admin/users", icon: "bi-people", title: "Users & approvals", desc: "Approve registrations, set roles, deactivate accounts" },
    { href: "/admin/alerts", icon: "bi-bell", title: "Alerts console", desc: "Rules, recipients, evaluate, acknowledge / resolve" },
    { href: "/admin/calendar", icon: "bi-calendar-range", title: "Flowering calendar", desc: "Phenology windows, day-shift, carry-forward" },
    { href: "/review", icon: "bi-clipboard-check", title: "Review queue", desc: "Validate submitted pollen records" },
  ];

  return (
    <>
      <PageHead eyebrow="Administration" title="Admin dashboard" />
      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", marginBottom: "1.25rem" }}>
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className="pa-card pa-card-hover" style={{ padding: "1rem" }}>
              <div className="text-xs text-mute"><i className={`bi ${t.icon}`} /> {t.label}</div>
              <div className="font-serif" style={{ fontSize: "2rem", lineHeight: 1.1, color: t.accent ? "#d9730d" : "var(--pa-primary)" }}>{t.value}</div>
            </Link>
          ))}
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))" }}>
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="pa-card pa-card-hover" style={{ padding: "1.1rem" }}>
              <strong><i className={`bi ${s.icon}`} /> {s.title}</strong>
              <div className="text-sm text-mute" style={{ marginTop: ".3rem" }}>{s.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
