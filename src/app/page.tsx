import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeForecast, visual } from "@/lib/risk";
import { StatusBadge } from "@/components/PageHead";
import { HeroArt } from "@/components/HeroArt";
import { Avatar } from "@/components/Avatar";
import { experts } from "@/lib/experts";
import { Ar } from "@/components/Ar";
import { getCurrentUser } from "@/lib/auth";
import { canContribute } from "@/lib/roles";

export const metadata = { title: "UAE Pollen Atlas — Pollen monitoring & decision support" };
export const dynamic = "force-dynamic"; // forecast uses the live current month + DB

function Stat({ value, label, href, icon }: { value: number; label: string; href: string; icon: string }) {
  return (
    <Link href={href} className="pa-stat pa-card-hover block">
      <div className="flex items-center justify-between">
        <div className="pa-stat-num">{value}</div>
        <i className={`bi ${icon}`} style={{ color: "var(--pa-primary-light)", fontSize: "1.6rem" }} />
      </div>
      <div className="pa-stat-label">{label}</div>
    </Link>
  );
}

export default async function Home() {
  const [species, types, published, regions, traps, hives, recent, featured, allergenic, forecast] =
    await Promise.all([
      prisma.plantSpecies.count(),
      prisma.pollenType.count(),
      prisma.pollenRecord.count({ where: { status: "Published" } }),
      prisma.region.count(),
      prisma.trapDevice.count(),
      prisma.beehive.count(),
      prisma.pollenRecord.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { pollenType: true, region: true } }),
      prisma.pollenType.findMany({ where: { status: "Published" }, take: 8, orderBy: { name: "asc" }, include: { plantSpecies: true } }),
      prisma.plantSpecies.findMany({ where: { isAllergenic: true }, take: 6 }),
      computeForecast(null),
    ]);

  const v = visual(forecast.riskLevel);
  const me = await getCurrentUser();
  const isContrib = !!me?.isApproved && canContribute(me.role);

  return (
    <>
      {/* ── Hero ── */}
      <div className="pa-page-head" style={{ paddingTop: "2.2rem", paddingBottom: "2.2rem" }}>
        <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="pa-eyebrow">Decision-support system · United Arab Emirates</div>
            <h1 className="pa-section-title" style={{ fontSize: "2.5rem", maxWidth: "20ch", marginTop: ".3rem" }}>
              The living atlas of UAE pollen, air quality &amp; allergy risk
            </h1>
            <p className="pa-section-subtitle" style={{ maxWidth: "52ch", marginTop: ".5rem" }}>
              Atlas predicts what pollen is in the air from the flowering calendar and historical records, fuses it
              with air quality, and renders a colour-coded risk index for the public, farmers, beekeepers, and growers.
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Link href="/map" className="pa-btn pa-btn-primary"><i className="bi bi-geo-alt" /> Open the map</Link>
              <Link href="/alerts" className="pa-btn pa-btn-outline"><i className="bi bi-bell" /> Get pollen alerts</Link>
              {isContrib && <Link href="/forecast" className="pa-btn pa-btn-outline"><i className="bi bi-flower2" /> Today&apos;s forecast</Link>}
            </div>
          </div>
          <div style={{ filter: "drop-shadow(0 18px 40px rgba(17,34,27,.10))" }}>
            <HeroArt />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        {/* ── Vision & Mission ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))" }}>
          <div className="pa-card">
            <div className="pa-card-body" style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--pa-primary-tint)", color: "var(--pa-primary)", display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                <i className="bi bi-binoculars" />
              </div>
              <div>
                <span className="pa-card-eyebrow">Our vision</span>
                <h2 className="font-serif" style={{ fontSize: "1.2rem", margin: ".15rem 0 .4rem" }}>Clean air, foreseen</h2>
                <p className="text-sm" style={{ color: "var(--pa-ink-soft)", margin: 0, lineHeight: 1.6 }}>
                  A Gulf where no one is caught off-guard by the air they breathe — an open, authoritative reference
                  for airborne pollen and its health impact across the United Arab Emirates.
                </p>
              </div>
            </div>
          </div>
          <div className="pa-card">
            <div className="pa-card-body" style={{ display: "flex", gap: "1rem" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--pa-accent-soft)", color: "#7a5b13", display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                <i className="bi bi-compass" />
              </div>
              <div>
                <span className="pa-card-eyebrow">Our mission</span>
                <h2 className="font-serif" style={{ fontSize: "1.2rem", margin: ".15rem 0 .4rem" }}>Monitor, predict, protect</h2>
                <p className="text-sm" style={{ color: "var(--pa-ink-soft)", margin: 0, lineHeight: 1.6 }}>
                  To monitor pollen at the source and in the air, predict its presence from phenology and history,
                  fuse it with live air quality into one clear risk index, and put that intelligence in the hands of
                  the public, clinicians, farmers, and beekeepers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meet the experts ── */}
        <div className="pa-card mt-3">
          <div className="pa-card-header">
            <div><span className="pa-card-eyebrow">The team</span><h2>Meet the experts</h2></div>
          </div>
          <div className="pa-card-body">
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              {experts.map((e) => (
                <div key={e.name} style={{ display: "flex", gap: ".9rem", alignItems: "flex-start" }}>
                  <Avatar name={e.name} color={e.color} photo={e.photo} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{e.name}</div>
                    <div className="text-xs" style={{ color: e.color, fontWeight: 600 }}>{e.title}</div>
                    <div style={{ margin: ".3rem 0" }}><span className="pa-pill pa-pill-mute" style={{ fontSize: ".68rem" }}>{e.specialty}</span></div>
                    <p className="text-xs text-mute" style={{ margin: 0, lineHeight: 1.5 }}>{e.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Dashboard stats ── */}
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <Stat value={species} label="Plants" href="/species" icon="bi-tree" />
          <Stat value={types} label="Pollen types" href="/pollen-types" icon="bi-circle-fill" />
          {isContrib && <Stat value={published} label="Published records" href="/records" icon="bi-card-list" />}
          <Stat value={regions} label="Regions" href="/map" icon="bi-geo" />
          <Stat value={traps} label="Trap devices" href="/map" icon="bi-broadcast-pin" />
          {isContrib && <Stat value={hives} label="Apiaries" href="/beehives" icon="bi-hexagon-fill" />}
        </div>

        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: isContrib ? "minmax(0, 1.4fr) minmax(0, 1fr)" : "1fr" }}>
          {isContrib && (
          <div className="pa-card">
            <div className="pa-card-header">
              <div><span className="pa-card-eyebrow">{forecast.monthName} · all UAE</span><h2>Pollen allergy forecast</h2></div>
              <span className="pa-badge" style={{ background: v.bg, color: v.fg, fontSize: ".8rem", padding: ".3rem .7rem" }}>{forecast.riskLevel}</span>
            </div>
            <div className="pa-card-body">
              <div className="flex items-baseline gap-2">
                <span className="font-serif" style={{ fontSize: "2.4rem", color: v.bg }}>{forecast.riskScore}</span>
                <span className="text-mute text-sm">risk score · {forecast.riskNote}</span>
              </div>
              {forecast.inSeason.length > 0 ? (
                <table className="pa-table mt-3">
                  <thead><tr><th>Active allergenic taxon</th><th>Plant</th><th style={{ textAlign: "right" }}>Intensity</th></tr></thead>
                  <tbody>
                    {forecast.inSeason.slice(0, 6).map((t) => (
                      <tr key={t.pollenTypeId}>
                        <td>{t.type} {t.flowering && <span className="pa-pill" style={{ marginLeft: 6 }}>in flower</span>}</td>
                        <td className="text-sm" style={{ fontStyle: "italic", color: "var(--pa-mute)" }}>{t.species}</td>
                        <td style={{ textAlign: "right" }} className="font-mono">{t.intensity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-mute text-sm mt-3">No active allergenic pollen on record for this month.</p>
              )}
              {forecast.latestAir && (
                <p className="text-xs text-mute mt-3">
                  Latest air: PM2.5 {forecast.latestAir.pm25?.toFixed(0) ?? "—"} · PM10 {forecast.latestAir.pm10?.toFixed(0) ?? "—"} µg/m³
                  {forecast.latestAir.dustEvent ? " · ⚠ dust event" : ""}
                </p>
              )}
            </div>
          </div>
          )}

          <div className="pa-card">
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">Watch list</span><h2>Allergenic plants</h2></div></div>
            <div className="pa-card-body">
              <div className="flex flex-col gap-2">
                {allergenic.map((s) => (
                  <Link key={s.id} href={`/species/${s.id}`} className="flex items-center justify-between" style={{ padding: ".4rem 0", borderBottom: "1px solid var(--pa-line-soft)" }}>
                    <span><span style={{ fontStyle: "italic" }}>{s.scientificName}</span> <span className="text-mute text-xs">{s.commonName}</span> <Ar text={s.commonNameAr} className="text-xs text-mute" /></span>
                    <span className="pa-pill pa-pill-amber"><i className="bi bi-exclamation-triangle" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: isContrib ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr" }}>
          {isContrib && (
          <div className="pa-card">
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">Latest</span><h2>Recent records</h2></div><Link href="/records" className="text-sm">All →</Link></div>
            <table className="pa-table">
              <thead><tr><th>Code</th><th>Type</th><th>Region</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs"><Link href={`/records/${r.id}`} style={{ fontWeight: 600 }}>{r.code}</Link></td>
                    <td className="text-sm">{r.pollenType.name}</td>
                    <td className="text-sm">{r.region?.name ?? "—"}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          <div className="pa-card">
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">Catalogue</span><h2>Featured pollen</h2></div><Link href="/pollen-types" className="text-sm">All →</Link></div>
            <div className="grid gap-2 p-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {featured.map((t) => (
                <Link key={t.id} href={`/pollen-types/${t.id}`} className="pa-card pa-card-hover" style={{ padding: ".7rem" }}>
                  <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{t.name}</div>
                  <div className="text-xs text-mute" style={{ fontStyle: "italic" }}>{t.plantSpecies.scientificName}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
