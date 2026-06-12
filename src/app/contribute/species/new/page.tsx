import { createSpecies } from "@/lib/contribute-actions";
import { PageHead, BackLink } from "@/components/PageHead";
import { Field, TextInput, Select, TextArea } from "@/components/form";
import { NativeStatus, HabitatType, FloweringSeason } from "@/lib/enums";

export const metadata = { title: "New plant · UAE Pollen Atlas" };

export default function NewSpeciesPage() {
  return (
    <>
      <PageHead eyebrow="Contribute" title="New plant"><BackLink href="/contribute" /></PageHead>
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 680 }}>
        <div className="pa-card"><div className="pa-card-body">
          <form action={createSpecies}>
            <Field label="Scientific name"><TextInput name="scientificName" required placeholder="Genus species" /></Field>
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Common name" hint="optional"><TextInput name="commonName" /></Field>
              <Field label="Arabic name" hint="optional"><TextInput name="commonNameAr" /></Field>
              <Field label="Family"><TextInput name="family" /></Field>
              <Field label="Genus"><TextInput name="genus" /></Field>
              <Field label="Native status"><Select name="nativeStatus" defaultValue="Unknown">{NativeStatus.map((o) => <option key={o}>{o}</option>)}</Select></Field>
              <Field label="Habitat"><Select name="habitat" defaultValue="Unspecified">{HabitatType.map((o) => <option key={o}>{o}</option>)}</Select></Field>
              <Field label="Flowering season"><Select name="floweringSeason" defaultValue="Unknown">{FloweringSeason.map((o) => <option key={o}>{o}</option>)}</Select></Field>
              <Field label="Flowering months" hint="CSV 1-12"><TextInput name="floweringMonths" placeholder="3,4,5" /></Field>
            </div>
            <div className="flex flex-wrap gap-4" style={{ margin: ".5rem 0 1rem" }}>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" name="isAllergenic" /> Allergenic</label>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" name="isBeeForage" /> Bee forage</label>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" name="isCultivationTarget" /> Cultivation target</label>
            </div>
            <Field label="Allergenicity notes" hint="optional"><TextArea name="allergenicNotes" rows={2} /></Field>
            <Field label="Description" hint="optional"><TextArea name="description" rows={3} /></Field>
            <button type="submit" className="pa-btn pa-btn-primary"><i className="bi bi-plus-lg" /> Create plant</button>
          </form>
        </div></div>
      </div>
    </>
  );
}
