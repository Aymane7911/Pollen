"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { requireManage } from "./auth";
import { carryForward } from "./calendar";

const int = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : parseInt(t, 10); };
const str = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : t; };

export async function createCalendarEntry(formData: FormData): Promise<void> {
  await requireManage();
  const plantSpeciesId = Number(formData.get("plantSpeciesId"));
  if (!plantSpeciesId) return;
  const regionId = int(formData.get("regionId"));
  const year = int(formData.get("year")) ?? new Date().getUTCFullYear();
  const data = {
    plantSpeciesId,
    regionId,
    year,
    startDoy: int(formData.get("startDoy")) ?? 1,
    endDoy: int(formData.get("endDoy")) ?? 90,
    peakDoy: int(formData.get("peakDoy")),
    shiftDays: int(formData.get("shiftDays")) ?? 0,
    notes: str(formData.get("notes")),
    carriedForward: false,
  };
  // Honour the (species, region, year) unique key: update if it exists, else create.
  const existing = await prisma.floweringCalendarEntry.findFirst({ where: { plantSpeciesId, regionId, year } });
  if (existing) await prisma.floweringCalendarEntry.update({ where: { id: existing.id }, data });
  else await prisma.floweringCalendarEntry.create({ data });
  revalidatePath("/admin/calendar");
}

export async function deleteCalendarEntry(formData: FormData): Promise<void> {
  await requireManage();
  await prisma.floweringCalendarEntry.delete({ where: { id: Number(formData.get("id")) } }).catch(() => {});
  revalidatePath("/admin/calendar");
}

export async function runCarryForward(formData: FormData): Promise<void> {
  await requireManage();
  const targetYear = Number(formData.get("targetYear")) || new Date().getUTCFullYear();
  await carryForward(targetYear);
  revalidatePath("/admin/calendar");
}
