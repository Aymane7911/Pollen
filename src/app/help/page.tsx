import Link from "next/link";
import { PageHead, StatusBadge } from "@/components/PageHead";

export const metadata = { title: "Help · UAE Pollen Atlas" };

const BANDS = [
  { level: "Low", color: "#1f5d3a", note: "Little or no allergenic pollen; safe for most." },
  { level: "Moderate", color: "#c98a2b", note: "Some allergenic pollen active; sensitive people may react." },
  { level: "High", color: "#d9730d", note: "Several taxa active and/or elevated dust; many will react." },
  { level: "Very high", color: "#b3261e", note: "Peak pollen and/or a dust event; most sufferers affected." },
];

const PIPELINE = ["Draft", "Submitted", "UnderReview", "Validated", "Published"];

const GLOSSARY: { term: string; def: string }[] = [
  { term: "Plant", def: "A plant species in the catalogue — its taxonomy, habitat, flowering season, and whether it is allergenic, bee-forage, or a cultivation target." },
  { term: "Pollen type", def: "The microscopic pollen produced by a plant, described by its morphology (size, shape, apertures, surface) so field samples can be identified." },
  { term: "Pollen record", def: "A single observation that a pollen type was collected at a place and time — by field sampling or from a trap." },
  { term: "Trap device", def: "A volumetric pollen trap (Hirst-type) that draws in air and captures airborne pollen on a band, sampled per day over a 7-day cycle." },
  { term: "Airborne sample / grains·m⁻³", def: "A trap's measured pollen load over a period, expressed as grains of pollen per cubic metre of air — the standard aerobiology unit." },
  { term: "Flowering calendar", def: "When each plant is in bloom, per region and year. The forecast uses it to predict what pollen could be in the air before it is even sampled." },
  { term: "Risk index", def: "A single colour-coded score (Low → Very high) combining allergenic pollen activity with the latest air quality." },
  { term: "Alert", def: "An automatic warning raised when a region's risk crosses a threshold, with a wind-direction 'plume' showing the affected downwind area." },
  { term: "Apiary (beehive)", def: "A registered, often mobile, bee colony location — useful for beekeepers tracking bee-forage plants in bloom." },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Do I need an account?", a: "No — anyone can browse the Map, the Plant and Pollen catalogues, the Flowering calendar, and read about the project. The Records, Forecast, Insights, and Apiaries sections, and all data entry, require a signed-in contributor, expert, or administrator account." },
  { q: "How do I become a contributor?", a: "Register, choose Contributor or Expert, optionally attach a credential document, confirm your email, then wait for an administrator to approve you. Once approved you can create records and submit them for review." },
  { q: "What's the difference between a Contributor and an Expert?", a: "A Contributor (Researcher) collects and submits pollen records. An Expert can do that and also validate — review submitted records and move them through to Published. Administrators manage users, alerts, and the calendar." },
  { q: "Where does the forecast come from?", a: "It is computed live from the allergenic plants in flower this month (flowering calendar + history), weighted by the peak concentration measured at traps over the last three weeks, then amplified by the latest air quality (dust events and high PM10 raise the score)." },
  { q: "Why does dust change the allergy risk?", a: "In the UAE, dust storms and high particulate (PM10) irritate airways and worsen allergic and respiratory symptoms, so a dusty day can push the risk band higher than pollen alone would." },
];

function Section({ icon, eyebrow, title, children }: { icon: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="pa-card mt-3">
      <div className="pa-card-header">
        <div className="flex items-center gap-3">
          <span style={{ width: 40, height: 40, borderRadius: 11, background: "var(--pa-primary-tint)", color: "var(--pa-primary)", display: "grid", placeItems: "center", fontSize: "1.15rem", flexShrink: 0 }}>
            <i className={`bi ${icon}`} />
          </span>
          <div><span className="pa-card-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        </div>
      </div>
      <div className="pa-card-body">{children}</div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <>
      <PageHead eyebrow="Help & guide" title="How the Pollen Atlas works" subtitle="What this is, who it's for, and how to use it." />

      <div className="mx-auto max-w-7xl px-4 pa-content">
        {/* In one sentence */}
        <div className="pa-card" style={{ borderLeft: "4px solid var(--pa-primary)" }}>
          <div className="pa-card-body">
            <span className="pa-card-eyebrow">In one sentence</span>
            <p className="font-serif" style={{ fontSize: "1.25rem", lineHeight: 1.5, margin: ".3rem 0 0", color: "var(--pa-ink)" }}>
              The UAE Pollen Atlas tells you <strong>what pollen is in the air</strong> across the Emirates and
              <strong> how risky it is for allergies right now</strong> — fusing pollen with dust and air quality — and gives
              researchers a place to <strong>collect, validate, and publish</strong> the pollen data behind it.
            </p>
          </div>
        </div>

        <Section icon="bi-compass" eyebrow="Overview" title="What it does">
          <p className="text-sm" style={{ marginTop: 0, color: "var(--pa-ink-soft)", lineHeight: 1.7 }}>
            It is a <strong>decision-support system</strong>, not just a database. It predicts pollen presence from a
            flowering calendar and historical records, measures it at pollen traps, fuses that with live air quality into
            a single colour-coded <strong>risk index</strong>, and can raise <strong>alerts</strong> for authorities and
            hospitals — with a wind-direction model for the affected area. It serves several audiences from one dataset:
            the public (allergy risk), farmers and growers (vegetation &amp; cultivation), and beekeepers (bee-forage plants and apiaries).
          </p>
        </Section>

        <Section icon="bi-people" eyebrow="Audiences" title="Who it's for & what you can do">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            {[
              { who: "Anyone (no account)", icon: "bi-globe", can: "Browse the Map, Plant & Pollen catalogues, the Flowering calendar, and the About page." },
              { who: "Contributor", icon: "bi-plus-square", can: "Everything above, plus create pollen records, plants, and pollen types, and submit them for review. Sees Records, Forecast, Insights & Apiaries." },
              { who: "Expert", icon: "bi-clipboard-check", can: "Everything a contributor can, plus validate — review submissions and move them to Published." },
              { who: "Administrator", icon: "bi-shield-lock", can: "Approve registrations, set roles, manage the alert rules & recipients, and curate the flowering calendar." },
            ].map((r) => (
              <div key={r.who} style={{ border: "1px solid var(--pa-line)", borderRadius: "var(--pa-radius-sm)", padding: ".9rem" }}>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: ".4rem" }}><i className={`bi ${r.icon}`} style={{ color: "var(--pa-primary)" }} /> {r.who}</div>
                <p className="text-xs text-mute" style={{ margin: ".35rem 0 0", lineHeight: 1.5 }}>{r.can}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section icon="bi-flower2" eyebrow="Methodology" title="How the allergy risk index works">
          <p className="text-sm" style={{ marginTop: 0, color: "var(--pa-ink-soft)", lineHeight: 1.7 }}>
            The risk index combines (1) <strong>which allergenic plants are releasing pollen now</strong> — from the
            flowering calendar and historical records, weighted by the peak concentration <em>measured at traps</em>
            (grains·m⁻³) over the last three weeks — and (2) the <strong>latest air quality</strong>, since dust events and
            high PM10 worsen symptoms. The result is one score on four bands:
          </p>
          <div className="flex flex-col gap-2 mt-3">
            {BANDS.map((b) => (
              <div key={b.level} className="flex items-center gap-3">
                <span className="pa-badge" style={{ background: b.color, color: b.level === "Moderate" ? "#15130c" : "#fff", minWidth: 84, textAlign: "center" }}>{b.level}</span>
                <span className="text-sm text-mute">{b.note}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section icon="bi-diagram-3" eyebrow="Data quality" title="The data journey: from field to published">
          <p className="text-sm" style={{ marginTop: 0, color: "var(--pa-ink-soft)", lineHeight: 1.7 }}>
            Pollen is collected two ways — <strong>field sampling</strong> (cut a flowering plant, identify its pollen in the lab)
            and <strong>traps</strong> (a volumetric sampler captures airborne pollen per day over a 7-day cycle). Every record
            then moves through a review pipeline, and every step is recorded in an audit trail:
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {PIPELINE.map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <StatusBadge status={s} />
                {i < PIPELINE.length - 1 && <i className="bi bi-arrow-right" style={{ color: "var(--pa-mute)", fontSize: ".8rem" }} />}
              </span>
            ))}
          </div>
          <p className="text-xs text-mute mt-3" style={{ marginBottom: 0 }}>
            A contributor creates a <strong>Draft</strong> and <strong>submits</strong> it. An expert begins review
            (<strong>Under review</strong>), then <strong>validates</strong> or <strong>rejects</strong> it. Validated records are
            <strong> published</strong> and become publicly visible. Only published data appears in the public catalogues.
          </p>
        </Section>

        <Section icon="bi-key" eyebrow="Access" title="Getting an account">
          <ol className="text-sm" style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.8, color: "var(--pa-ink-soft)" }}>
            <li><Link href="/register">Register</Link> — name, email, choose <strong>Contributor</strong> or <strong>Expert</strong>, and (optionally) attach a credential document.</li>
            <li><strong>Confirm your email</strong> from the link you receive.</li>
            <li>An <strong>administrator approves</strong> your account (they can see your credential document).</li>
            <li><Link href="/login">Sign in</Link> — the Contribute, and (for experts) Review, tools appear in the menu.</li>
          </ol>
        </Section>

        <Section icon="bi-book" eyebrow="Reference" title="Glossary">
          <dl className="pa-dl" style={{ gridTemplateColumns: "12rem 1fr" }}>
            {GLOSSARY.map((g) => (
              <div key={g.term} style={{ display: "contents" }}>
                <dt style={{ fontWeight: 600, color: "var(--pa-ink)" }}>{g.term}</dt>
                <dd className="text-sm">{g.def}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section icon="bi-question-circle" eyebrow="FAQ" title="Frequently asked">
          <div className="flex flex-col gap-3">
            {FAQ.map((f) => (
              <div key={f.q} style={{ borderBottom: "1px solid var(--pa-line-soft)", paddingBottom: ".75rem" }}>
                <div style={{ fontWeight: 600 }}>{f.q}</div>
                <p className="text-sm text-mute" style={{ margin: ".25rem 0 0", lineHeight: 1.6 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Link href="/map" className="pa-btn pa-btn-primary"><i className="bi bi-geo-alt" /> Explore the map</Link>
          <Link href="/register" className="pa-btn pa-btn-outline"><i className="bi bi-person-plus" /> Become a contributor</Link>
          <Link href="/about" className="pa-btn pa-btn-outline"><i className="bi bi-info-circle" /> About the project</Link>
        </div>
      </div>
    </>
  );
}
