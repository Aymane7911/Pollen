import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeForecast, visual, healthAdvice, bandLabel } from "@/lib/risk";
import { PageHead } from "@/components/PageHead";
import { requireContribute } from "@/lib/auth";

export const metadata = { title: "Pollen Allergy Forecast · UAE Pollen Atlas" };

const selectStyle = {
  padding: ".45rem .75rem",
  border: "1px solid var(--pa-line)",
  borderRadius: "var(--pa-radius-sm)",
  background: "var(--pa-surface)",
  fontSize: ".9rem",
  color: "var(--pa-ink)",
} as const;

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ regionId?: string }>;
}) {
  await requireContribute();
  const { regionId: regionIdParam } = await searchParams;
  const regionId = regionIdParam ? Number(regionIdParam) : null;

  const [forecast, regions] = await Promise.all([
    computeForecast(Number.isNaN(regionId as number) ? null : regionId),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
  ]);

  const v = visual(forecast.riskLevel);
  const air = forecast.latestAir;

  return (
    <>
      <PageHead
        eyebrow="Public health"
        title="Pollen Allergy Forecast"
        subtitle={`${forecast.monthName} · ${forecast.regionName}`}
      />

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <form method="get" className="flex items-center gap-2 mb-3 flex-wrap">
          <select name="regionId" defaultValue={forecast.regionId ?? ""} className="pa-input" style={selectStyle}>
            <option value="">All UAE</option>
            {regions.map((rg) => (
              <option key={rg.id} value={rg.id}>
                {rg.name}{rg.nameAr ? ` · ${rg.nameAr}` : ""}
              </option>
            ))}
          </select>
          <button type="submit" className="pa-btn pa-btn-primary">
            <i className="bi bi-flower2" /> Update forecast
          </button>
          {forecast.regionId != null && (
            <Link href="/forecast" className="pa-btn pa-btn-outline">
              All UAE
            </Link>
          )}
        </form>

        {/* Hero risk card — matches the Home dashboard forecast card treatment. */}
        <div className="pa-card">
          <div className="pa-card-header">
            <div>
              <span className="pa-card-eyebrow">{forecast.monthName} · {forecast.regionName}</span>
              <h2>Pollen allergy risk</h2>
            </div>
            <span
              className="pa-badge"
              style={{ background: v.bg, color: v.fg, fontSize: ".9rem", padding: ".35rem .85rem" }}
            >
              {forecast.riskLevel}
            </span>
          </div>
          <div className="pa-card-body">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-serif" style={{ fontSize: "3rem", lineHeight: 1, color: v.bg }}>
                {forecast.riskScore}
              </span>
              <span className="text-mute text-sm">risk score</span>
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--pa-ink-soft)" }}>
              {forecast.riskNote}
            </p>
            {forecast.hasMeasuredData && (
              <p className="text-xs mt-2" style={{ color: "var(--pa-mute)" }}>
                <i className="bi bi-broadcast-pin" /> Trap-measured peak:{" "}
                <strong>{forecast.peakTaxon}</strong> at {forecast.peakGrainsPerM3?.toFixed(0)} grains/m³
                {" "}(last 21 days) — measured load drives the score over the calendar proxy.
              </p>
            )}
            <div className="mt-3" style={{ background: v.bg, color: v.fg, borderRadius: "var(--pa-radius-sm)", padding: ".65rem .85rem", fontSize: ".85rem", lineHeight: 1.5 }}>
              <i className="bi bi-heart-pulse" /> <strong>Advice:</strong> {healthAdvice(forecast.riskLevel)}
            </div>
          </div>
        </div>

        {/* Active allergenic taxa for the month. */}
        <div className="pa-card mt-3">
          <div className="pa-card-header">
            <div>
              <span className="pa-card-eyebrow">In season</span>
              <h2>Active allergenic taxa</h2>
            </div>
            <span className="pa-pill pa-pill-mute">{forecast.inSeason.length}</span>
          </div>
          {forecast.inSeason.length === 0 ? (
            <div className="pa-empty">
              <i className="bi bi-flower2" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
              <div className="pa-empty-title">No active allergenic pollen</div>
              <p className="text-sm text-mute">
                Nothing allergenic is flowering or on record for {forecast.monthName} in {forecast.regionName}.
              </p>
            </div>
          ) : (
            <table className="pa-table">
              <thead>
                <tr>
                  <th>Taxon</th>
                  <th>Plant</th>
                  <th style={{ textAlign: "right" }}>Records</th>
                  <th style={{ textAlign: "right" }}>grains/m³</th>
                  <th style={{ textAlign: "right" }}>Band</th>
                  <th style={{ textAlign: "right" }}>Intensity</th>
                </tr>
              </thead>
              <tbody>
                {forecast.inSeason.map((t) => (
                  <tr key={t.pollenTypeId}>
                    <td>
                      <Link href={`/pollen-types/${t.pollenTypeId}`} style={{ fontWeight: 600 }}>
                        {t.type}
                      </Link>
                      {t.flowering && (
                        <span className="pa-pill pa-pill-amber" style={{ marginLeft: ".4rem" }}>
                          <i className="bi bi-flower1" /> in flower
                        </span>
                      )}
                      {t.measured && (
                        <span className="pa-pill pa-pill-info" style={{ marginLeft: ".4rem" }}>
                          <i className="bi bi-broadcast-pin" /> measured
                        </span>
                      )}
                    </td>
                    <td className="text-sm" style={{ fontStyle: "italic", color: "var(--pa-mute)" }}>
                      {t.species}
                    </td>
                    <td className="font-mono text-xs" style={{ textAlign: "right" }}>
                      {t.recordCount}
                    </td>
                    <td className="font-mono text-xs" style={{ textAlign: "right" }}>
                      {t.measured ? t.grainsPerM3!.toFixed(0) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {t.band != null ? (
                        <span className="pa-badge" style={{ background: visual(bandLabel(t.band)).bg, color: visual(bandLabel(t.band)).fg }}>
                          {bandLabel(t.band)}
                        </span>
                      ) : (
                        <span className="text-mute text-xs">—</span>
                      )}
                    </td>
                    <td className="font-mono" style={{ textAlign: "right" }}>
                      {t.intensity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Latest air quality — pollution amplifies the pollen risk. */}
        {air && (
          <div className="pa-card mt-3" style={{ maxWidth: "32rem" }}>
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Air quality</span>
                <h2>Latest air quality</h2>
              </div>
              {air.dustEvent && (
                <span className="pa-pill pa-pill-amber">
                  <i className="bi bi-exclamation-triangle" /> Dust event
                </span>
              )}
            </div>
            <div className="pa-card-body">
              <dl className="pa-dl">
                <dt>PM2.5</dt>
                <dd>{air.pm25 != null ? `${air.pm25.toFixed(0)} µg/m³` : "—"}</dd>
                <dt>PM10</dt>
                <dd>{air.pm10 != null ? `${air.pm10.toFixed(0)} µg/m³` : "—"}</dd>
                <dt>Dust event</dt>
                <dd>{air.dustEvent ? "⚠ Yes" : "No"}</dd>
                <dt>Wind</dt>
                <dd>
                  {air.windSpeedMs != null ? `${air.windSpeedMs.toFixed(1)} m/s` : "—"}
                  {air.windDirectionDeg != null && ` @ ${air.windDirectionDeg.toFixed(0)}°`}
                </dd>
                <dt>Measured</dt>
                <dd className="font-mono text-xs">{air.measuredAt.toISOString().slice(0, 10)}</dd>
              </dl>
              <p className="text-xs text-mute mt-3">
                Pollution amplifies allergy risk: the score adds for active dust events and high PM10, so dusty
                days raise the band even when pollen alone would be moderate.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
