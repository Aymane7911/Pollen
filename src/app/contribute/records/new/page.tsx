import { prisma } from "@/lib/db";
import { createRecord } from "@/lib/contribute-actions";
import { PageHead, BackLink } from "@/components/PageHead";
import { Field, TextInput, Select, TextArea } from "@/components/form";
import { SampleSourceType } from "@/lib/enums";

export const metadata = { title: "New record · UAE Pollen Atlas" };

export default async function NewRecordPage() {
  const [types, species, regions] = await Promise.all([
    prisma.pollenType.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.plantSpecies.findMany({ orderBy: { scientificName: "asc" }, select: { id: true, scientificName: true } }),
    prisma.region.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHead eyebrow="Contribute" title="New pollen record"><BackLink href="/contribute" /></PageHead>
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 680 }}>
        <div className="pa-card"><div className="pa-card-body">
          <form action={createRecord}>
            <Field label="Pollen type">
              <Select name="pollenTypeId" required defaultValue="">
                <option value="" disabled>Select…</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </Field>
            <Field label="Plant" hint="optional">
              <Select name="plantSpeciesId" defaultValue="">
                <option value="">—</option>
                {species.map((s) => <option key={s.id} value={s.id}>{s.scientificName}</option>)}
              </Select>
            </Field>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Region">
                <Select name="regionId" defaultValue="">
                  <option value="">—</option>
                  {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>
              <Field label="Source">
                <Select name="source" defaultValue="FieldPlantSample">
                  {SampleSourceType.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Location name" hint="optional"><TextInput name="locationName" placeholder="e.g. Al Dhaid field site" /></Field>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <Field label="Latitude"><TextInput name="latitude" type="number" step="any" placeholder="25.3" /></Field>
              <Field label="Longitude"><TextInput name="longitude" type="number" step="any" placeholder="55.4" /></Field>
              <Field label="Collected on"><TextInput name="collectedOn" type="date" required /></Field>
            </div>
            <Field label="Notes" hint="optional"><TextArea name="notes" rows={3} /></Field>
            <button type="submit" className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> Create draft record</button>
          </form>
        </div></div>
      </div>
    </>
  );
}
