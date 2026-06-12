import { prisma } from "@/lib/db";
import { createPollenType } from "@/lib/contribute-actions";
import { PageHead, BackLink } from "@/components/PageHead";
import { Field, TextInput, Select, TextArea } from "@/components/form";
import { PollenShape, AperturePattern, SurfaceOrnamentation } from "@/lib/enums";

export const metadata = { title: "New pollen type · UAE Pollen Atlas" };

export default async function NewTypePage() {
  const species = await prisma.plantSpecies.findMany({ orderBy: { scientificName: "asc" }, select: { id: true, scientificName: true } });
  return (
    <>
      <PageHead eyebrow="Contribute" title="New pollen type"><BackLink href="/contribute" /></PageHead>
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 680 }}>
        <div className="pa-card"><div className="pa-card-body">
          <form action={createPollenType}>
            <Field label="Name"><TextInput name="name" required placeholder="e.g. Phoenix dactylifera pollen" /></Field>
            <Field label="Plant">
              <Select name="plantSpeciesId" required defaultValue="">
                <option value="" disabled>Select…</option>
                {species.map((s) => <option key={s.id} value={s.id}>{s.scientificName}</option>)}
              </Select>
            </Field>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Size min (µm)"><TextInput name="sizeMicronsMin" type="number" step="any" /></Field>
              <Field label="Size max (µm)"><TextInput name="sizeMicronsMax" type="number" step="any" /></Field>
              <Field label="Shape"><Select name="shape" defaultValue="Unknown">{PollenShape.map((o) => <option key={o}>{o}</option>)}</Select></Field>
              <Field label="Apertures"><Select name="apertures" defaultValue="Unknown">{AperturePattern.map((o) => <option key={o}>{o}</option>)}</Select></Field>
            </div>
            <Field label="Surface"><Select name="surface" defaultValue="Unknown">{SurfaceOrnamentation.map((o) => <option key={o}>{o}</option>)}</Select></Field>
            <Field label="Diagnostic features" hint="optional"><TextArea name="diagnosticFeatures" rows={2} /></Field>
            <Field label="Morphology notes" hint="optional"><TextArea name="morphologyNotes" rows={2} /></Field>
            <button type="submit" className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> Create draft type</button>
          </form>
        </div></div>
      </div>
    </>
  );
}
