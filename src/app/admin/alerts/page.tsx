import { prisma } from "@/lib/db";
import { requireManage } from "@/lib/auth";
import { visual } from "@/lib/risk";
import {
  evaluateNow, createRule, toggleRule, deleteRule,
  createRecipient, deleteRecipient, setAlertStatus,
} from "@/lib/alert-admin-actions";
import { PageHead } from "@/components/PageHead";
import { Field, TextInput, Select, TextArea } from "@/components/form";

export const metadata = { title: "Alerts console · Admin" };

const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

export default async function AlertsConsolePage() {
  await requireManage();
  const [alerts, rules, recipients, regions] = await Promise.all([
    prisma.alert.findMany({ include: { region: true }, orderBy: { raisedAt: "desc" }, take: 50 }),
    prisma.alertRule.findMany({ include: { region: true }, orderBy: { id: "asc" } }),
    prisma.alertRecipient.findMany({ include: { region: true }, orderBy: { id: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHead eyebrow="Administration" title="Alerts console" subtitle="§9 decision-support — rules, recipients, dispatch">
        <form action={evaluateNow}>
          <button className="pa-btn pa-btn-primary"><i className="bi bi-lightning-charge" /> Evaluate now</button>
        </form>
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content flex flex-col gap-3">
        {/* Fired alerts */}
        <div className="pa-card">
          <div className="pa-card-header"><div><span className="pa-card-eyebrow">Dispatch</span><h2>Recent alerts</h2></div><span className="pa-pill pa-pill-mute">{alerts.length}</span></div>
          {alerts.length === 0 ? (
            <div className="pa-empty">No alerts raised. Add a rule and click <strong>Evaluate now</strong>.</div>
          ) : (
            <table className="pa-table">
              <thead><tr><th>Raised</th><th>Region</th><th>Risk</th><th>Summary</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
              <tbody>
                {alerts.map((a) => {
                  const v = visual(a.riskLevel);
                  return (
                    <tr key={a.id}>
                      <td className="font-mono text-xs">{fmt(a.raisedAt)}</td>
                      <td>{a.region.name}</td>
                      <td><span className="pa-badge" style={{ background: v.bg, color: v.fg }}>{a.riskLevel} · {a.riskScore}</span></td>
                      <td className="text-xs" style={{ maxWidth: 320 }}>{a.summary}<div className="text-mute" style={{ marginTop: ".2rem" }}><i className="bi bi-send" /> {a.recipientCount} recipient(s)</div></td>
                      <td><span className="pa-pill pa-pill-mute">{a.status}</span></td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex gap-1 justify-end">
                          {a.status !== "Acknowledged" && a.status !== "Resolved" && (
                            <form action={setAlertStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="Acknowledged" /><button className="pa-btn pa-btn-outline" style={{ padding: ".25rem .5rem" }} title="Acknowledge" aria-label="Acknowledge alert"><i className="bi bi-eye" /></button></form>
                          )}
                          {a.status !== "Resolved" && (
                            <form action={setAlertStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value="Resolved" /><button className="pa-btn pa-btn-outline" style={{ padding: ".25rem .5rem" }} title="Resolve" aria-label="Resolve alert"><i className="bi bi-check2-all" /></button></form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px,1fr))" }}>
          {/* Rules */}
          <div className="pa-card">
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">Thresholds</span><h2>Alert rules</h2></div><span className="pa-pill pa-pill-mute">{rules.length}</span></div>
            <div className="pa-card-body">
              <div className="flex flex-col gap-2" style={{ marginBottom: "1rem" }}>
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-2" style={{ borderBottom: "1px solid var(--pa-line)", paddingBottom: ".5rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{r.name} {!r.isActive && <span className="text-mute text-xs">· off</span>}</div>
                      <div className="text-xs text-mute">score ≥ {r.minScore} · {r.region?.name ?? "all regions"} · cooldown {r.cooldownHours}h · {[r.notifyAuthorities && "authorities", r.notifyHospitals && "hospitals"].filter(Boolean).join(" + ") || "no channels"}</div>
                    </div>
                    <form action={toggleRule}><input type="hidden" name="id" value={r.id} /><button className="pa-btn pa-btn-outline" style={{ padding: ".25rem .5rem" }} title={r.isActive ? "Disable" : "Enable"} aria-label={r.isActive ? "Disable rule" : "Enable rule"}><i className={`bi ${r.isActive ? "bi-toggle-on" : "bi-toggle-off"}`} /></button></form>
                    <form action={deleteRule}><input type="hidden" name="id" value={r.id} /><button className="pa-btn pa-btn-outline" style={{ padding: ".25rem .5rem" }} title="Delete" aria-label="Delete rule"><i className="bi bi-trash" /></button></form>
                  </div>
                ))}
                {rules.length === 0 && <div className="text-sm text-mute">No rules yet.</div>}
              </div>
              <form action={createRule}>
                <Field label="Rule name"><TextInput name="name" required placeholder="High-risk pollen alert" /></Field>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Region"><Select name="regionId" defaultValue=""><option value="">All regions</option>{regions.map((rg) => <option key={rg.id} value={rg.id}>{rg.name}</option>)}</Select></Field>
                  <Field label="Min score"><TextInput name="minScore" type="number" defaultValue={8} min={1} max={50} /></Field>
                </div>
                <Field label="Cooldown (hours)"><TextInput name="cooldownHours" type="number" defaultValue={24} min={1} max={168} /></Field>
                <div className="flex gap-4" style={{ margin: ".25rem 0 .75rem" }}>
                  <label className="text-sm flex items-center gap-2"><input type="checkbox" name="notifyAuthorities" defaultChecked /> Authorities</label>
                  <label className="text-sm flex items-center gap-2"><input type="checkbox" name="notifyHospitals" defaultChecked /> Hospitals</label>
                </div>
                <Field label="Recommended actions" hint="optional"><TextArea name="recommendedActions" rows={2} placeholder="Advise sensitive groups…" /></Field>
                <button className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> Add rule</button>
              </form>
            </div>
          </div>

          {/* Recipients */}
          <div className="pa-card">
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">Targets</span><h2>Recipients</h2></div><span className="pa-pill pa-pill-mute">{recipients.length}</span></div>
            <div className="pa-card-body">
              <div className="flex flex-col gap-2" style={{ marginBottom: "1rem" }}>
                {recipients.map((r) => (
                  <div key={r.id} className="flex items-center gap-2" style={{ borderBottom: "1px solid var(--pa-line)", paddingBottom: ".5rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{r.name} <span className="pa-pill pa-pill-mute" style={{ fontSize: ".7rem" }}>{r.kind}</span></div>
                      <div className="text-xs text-mute">{[r.email, r.phone, r.region?.name].filter(Boolean).join(" · ") || "no contact"}</div>
                    </div>
                    <form action={deleteRecipient}><input type="hidden" name="id" value={r.id} /><button className="pa-btn pa-btn-outline" style={{ padding: ".25rem .5rem" }} title="Delete" aria-label="Delete recipient"><i className="bi bi-trash" /></button></form>
                  </div>
                ))}
                {recipients.length === 0 && <div className="text-sm text-mute">No recipients yet.</div>}
              </div>
              <form action={createRecipient}>
                <Field label="Name"><TextInput name="name" required placeholder="Dubai Municipality" /></Field>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Kind"><Select name="kind" defaultValue="Authority"><option>Authority</option><option>Hospital</option><option>Public</option><option>Other</option></Select></Field>
                  <Field label="Region"><Select name="regionId" defaultValue=""><option value="">All regions</option>{regions.map((rg) => <option key={rg.id} value={rg.id}>{rg.name}</option>)}</Select></Field>
                </div>
                <Field label="Email" hint="optional"><TextInput name="email" type="email" placeholder="ops@authority.ae" /></Field>
                <Field label="Phone" hint="optional"><TextInput name="phone" placeholder="+9715…" /></Field>
                <button className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> Add recipient</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
