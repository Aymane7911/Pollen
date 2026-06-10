import Link from "next/link";
import { PageHead } from "@/components/PageHead";

export const metadata = { title: "About · UAE Pollen Atlas" };

const BANDS = [
  { level: "Low", color: "#1f5d3a" },
  { level: "Moderate", color: "#c98a2b" },
  { level: "High", color: "#d9730d" },
  { level: "Very high", color: "#b3261e" },
];

export default function AboutPage() {
  return (
    <>
      <PageHead
        eyebrow="About"
        title="About the Atlas"
        subtitle="Pollen monitoring & decision support for the UAE."
      />

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {/* What Atlas is */}
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Overview</span>
                <h2>What the Atlas is</h2>
              </div>
            </div>
            <div className="pa-card-body">
              <p className="text-sm" style={{ color: "var(--pa-ink-soft)" }}>
                The UAE Pollen Atlas is a decision-support system. It predicts what pollen is airborne from the
                flowering calendar of recorded species combined with historical pollen records, fuses that signal
                with live air-quality readings, and renders the result as a single colour-coded risk index. The same
                index serves several audiences at once — from the public checking allergy risk to specialists
                planning cultivation.
              </p>
            </div>
          </div>

          {/* Who it serves */}
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Audiences</span>
                <h2>Who it serves</h2>
              </div>
            </div>
            <div className="pa-card-body">
              <ul className="text-sm" style={{ color: "var(--pa-ink-soft)", paddingLeft: "1.1rem", margin: 0, display: "flex", flexDirection: "column", gap: ".5rem" }}>
                <li>
                  <strong>General public</strong> — daily airborne-pollen allergy risk for the days ahead.
                </li>
                <li>
                  <strong>Farmers</strong> — vegetation and flowering signals across the regions.
                </li>
                <li>
                  <strong>Beekeepers</strong> — bee-forage species in bloom and registered apiary locations.
                </li>
                <li>
                  <strong>Pharma &amp; cultivation specialists</strong> — allergenic and cultivation-target taxa for
                  sourcing and planning.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* How the risk index works */}
        <div className="pa-card mt-3">
          <div className="pa-card-header">
            <div>
              <span className="pa-card-eyebrow">Methodology</span>
              <h2>How the risk index works</h2>
            </div>
          </div>
          <div className="pa-card-body">
            <p className="text-sm" style={{ color: "var(--pa-ink-soft)" }}>
              The risk index is reported on four bands. Pollution amplifies the risk — active dust events and high
              PM10 add to the score, so a dusty day can push the band higher than pollen alone would.
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {BANDS.map((b) => (
                <span
                  key={b.level}
                  className="pa-badge"
                  style={{
                    background: b.color,
                    color: b.level === "Moderate" ? "#15130c" : "#ffffff",
                    fontSize: ".8rem",
                    padding: ".3rem .7rem",
                  }}
                >
                  {b.level}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {/* Built with */}
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Technology</span>
                <h2>Built with</h2>
              </div>
            </div>
            <div className="pa-card-body">
              <ul className="text-sm" style={{ color: "var(--pa-ink-soft)", paddingLeft: "1.1rem", margin: 0, display: "flex", flexDirection: "column", gap: ".4rem" }}>
                <li>Next.js (App Router) + TypeScript</li>
                <li>Prisma + SQLite</li>
                <li>Leaflet maps</li>
                <li>Recharts</li>
              </ul>
            </div>
          </div>

          {/* Open data */}
          <div className="pa-card">
            <div className="pa-card-header">
              <div>
                <span className="pa-card-eyebrow">Open data</span>
                <h2>Open data &amp; API</h2>
              </div>
            </div>
            <div className="pa-card-body">
              <p className="text-sm" style={{ color: "var(--pa-ink-soft)" }}>
                Atlas content is published under{" "}
                <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
                  CC BY 4.0
                </a>
                . A public JSON API exposes the species, pollen types, and flowering calendar.
              </p>
              <Link href="/api/v1/meta" className="pa-btn pa-btn-outline mt-3">
                <i className="bi bi-braces" /> /api/v1/meta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
