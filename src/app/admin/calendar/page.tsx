import { prisma } from "@/lib/db";
import { requireManage } from "@/lib/auth";
import { createCalendarEntry, deleteCalendarEntry, runCarryForward } from "@/lib/calendar-actions";
import { PageHead } from "@/components/PageHead";
import { Field, TextInput, Select, TextArea } from "@/components/form";

export const metadata = { title: "Flowering calendar · Admin" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function doyLabel(doy: number): string {
  const d = new Date(Date.UTC(2025, 0, 1));
  d.setUTCDate(doy);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export default async function CalendarAdminPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requireManage();
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : new Date().getUTCFullYear();

  const [entries, species, regions] = await Promise.all([
    prisma.floweringCalendarEntry.findMany({ where: { year }, include: { plantSpecies: true, region: true }, orderBy: [{ startDoy: "asc" }] }),
    prisma.plantSpecies.findMany({ orderBy: { scientificName: "asc" }, select: { id: true, scientificName: true } }),
    prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHead eyebrow="Administration" title="Flowering calendar" subtitle={`Region/year-aware phenology windows · ${year}`}>
        <form action={runCarryForward}>
          <input type="hidden" name="targetYear" value={year} />
          <button className="pa-btn pa-btn-outline"><i className="bi bi-arrow-right-circle" /> Carry forward → {year}</button>
        </form>
      </PageHead>

      <div className="mx-auto max-w-7xl px-4 pa-content">
        <div className="grid gap-3" style={{ gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
          <div className="pa-card" style={{ alignSelf: "start" }}>
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">{year}</span><h2>Calendar entries</h2></div><span className="pa-pill pa-pill-mute">{entries.length}</span></div>
            {entries.length === 0 ? (
              <div className="pa-empty">
                <i className="bi bi-calendar-range" style={{ fontSize: "2rem", color: "var(--pa-primary-light)" }} />
                <div className="pa-empty-title">No entries for {year}</div>
                <p className="text-sm text-mute">Add a window, or carry forward last year&apos;s. The forecast uses these windows in place of the flat flowering-months fallback.</p>
              </div>
            ) : (
              <table className="pa-table">
                <thead><tr><th>Plant</th><th>Region</th><th>Window</th><th>Shift</th><th></th></tr></thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontStyle: "italic" }}>{e.plantSpecies.scientificName}{e.carriedForward && <span className="pa-pill pa-pill-mute" style={{ marginLeft: ".4rem", fontSize: ".7rem" }}>carried</span>}</td>
                      <td>{e.region?.name ?? "UAE-wide"}</td>
                      <td className="text-xs">{doyLabel(e.startDoy)} – {doyLabel(e.endDoy)}{e.peakDoy != null && <span className="text-mute"> · peak {doyLabel(e.peakDoy)}</span>}</td>
                      <td className="font-mono text-xs">{e.shiftDays > 0 ? `+${e.shiftDays}` : e.shiftDays}d</td>
                      <td style={{ textAlign: "right" }}><form action={deleteCalendarEntry}><input type="hidden" name="id" value={e.id} /><button className="pa-btn pa-btn-outline" style={{ padding: ".25rem .5rem" }} title="Delete" aria-label="Delete entry"><i className="bi bi-trash" /></button></form></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pa-card" style={{ alignSelf: "start" }}>
            <div className="pa-card-header"><div><span className="pa-card-eyebrow">New / update</span><h2>Add entry</h2></div></div>
            <div className="pa-card-body">
              <form action={createCalendarEntry}>
                <Field label="Plant"><Select name="plantSpeciesId" required defaultValue=""><option value="" disabled>Select…</option>{species.map((s) => <option key={s.id} value={s.id}>{s.scientificName}</option>)}</Select></Field>
                <Field label="Region" hint="blank = UAE-wide default"><Select name="regionId" defaultValue=""><option value="">UAE-wide</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
                <Field label="Year"><TextInput name="year" type="number" defaultValue={year} /></Field>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <Field label="Start DOY" hint="1-366"><TextInput name="startDoy" type="number" min={1} max={366} defaultValue={60} /></Field>
                  <Field label="End DOY"><TextInput name="endDoy" type="number" min={1} max={366} defaultValue={150} /></Field>
                  <Field label="Peak" hint="opt"><TextInput name="peakDoy" type="number" min={1} max={366} /></Field>
                </div>
                <Field label="Shift days" hint="rain/season shift −60..60"><TextInput name="shiftDays" type="number" defaultValue={0} min={-60} max={60} /></Field>
                <Field label="Notes" hint="optional"><TextArea name="notes" rows={2} /></Field>
                <button className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> Save entry</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
