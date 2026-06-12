"use server";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { requireContribute } from "./auth";

const str = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : t; };
const num = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : Number(t); };
const int = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : parseInt(t, 10); };
const seasonOf = (m: number) => (m <= 2 || m === 12 ? "Winter" : m <= 5 ? "Spring" : m <= 8 ? "Summer" : "Autumn");

export async function createRecord(formData: FormData): Promise<void> {
  const user = await requireContribute();
  const pollenTypeId = Number(formData.get("pollenTypeId"));
  if (!pollenTypeId) redirect("/contribute/records/new");

  const collectedOnStr = String(formData.get("collectedOn") || "");
  const collectedOn = collectedOnStr ? new Date(collectedOnStr) : new Date();
  const y = collectedOn.getUTCFullYear();
  const m = collectedOn.getUTCMonth() + 1;
  const code = `PA-${y}${String(m).padStart(2, "0")}-${randomBytes(3).toString("hex").toUpperCase()}`;

  const rec = await prisma.pollenRecord.create({
    data: {
      code,
      pollenTypeId,
      plantSpeciesId: int(formData.get("plantSpeciesId")),
      regionId: int(formData.get("regionId")),
      latitude: num(formData.get("latitude")),
      longitude: num(formData.get("longitude")),
      locationName: str(formData.get("locationName")),
      collectedOn,
      year: y,
      month: m,
      season: seasonOf(m),
      source: String(formData.get("source") || "FieldPlantSample"),
      notes: str(formData.get("notes")),
      status: "Draft",
      collectorId: user.id,
      collectorName: user.fullName,
    },
  });
  redirect(`/records/${rec.id}`);
}

export async function createSpecies(formData: FormData): Promise<void> {
  const user = await requireContribute();
  const scientificName = String(formData.get("scientificName") || "").trim();
  if (!scientificName) redirect("/contribute/species/new");

  const sp = await prisma.plantSpecies.create({
    data: {
      scientificName,
      commonName: str(formData.get("commonName")),
      commonNameAr: str(formData.get("commonNameAr")),
      family: str(formData.get("family")),
      genus: str(formData.get("genus")),
      nativeStatus: String(formData.get("nativeStatus") || "Unknown"),
      habitat: String(formData.get("habitat") || "Unspecified"),
      floweringSeason: String(formData.get("floweringSeason") || "Unknown"),
      floweringMonths: str(formData.get("floweringMonths")),
      isAllergenic: formData.get("isAllergenic") === "on",
      allergenicNotes: str(formData.get("allergenicNotes")),
      isBeeForage: formData.get("isBeeForage") === "on",
      isCultivationTarget: formData.get("isCultivationTarget") === "on",
      description: str(formData.get("description")),
      createdById: user.id,
      createdByName: user.fullName,
    },
  });
  redirect(`/species/${sp.id}`);
}

export async function createPollenType(formData: FormData): Promise<void> {
  const user = await requireContribute();
  const name = String(formData.get("name") || "").trim();
  const plantSpeciesId = Number(formData.get("plantSpeciesId"));
  if (!name || !plantSpeciesId) redirect("/contribute/types/new");

  const t = await prisma.pollenType.create({
    data: {
      name,
      plantSpeciesId,
      sizeMicronsMin: num(formData.get("sizeMicronsMin")),
      sizeMicronsMax: num(formData.get("sizeMicronsMax")),
      shape: String(formData.get("shape") || "Unknown"),
      apertures: String(formData.get("apertures") || "Unknown"),
      surface: String(formData.get("surface") || "Unknown"),
      diagnosticFeatures: str(formData.get("diagnosticFeatures")),
      morphologyNotes: str(formData.get("morphologyNotes")),
      status: "Draft",
      createdById: user.id,
      createdByName: user.fullName,
    },
  });
  redirect(`/pollen-types/${t.id}`);
}
