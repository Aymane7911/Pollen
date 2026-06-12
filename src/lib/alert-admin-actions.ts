"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { requireManage } from "./auth";
import { evaluateAlerts } from "./alerts";

const str = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : t; };
const int = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : parseInt(t, 10); };

export async function evaluateNow(): Promise<void> {
  await requireManage();
  await evaluateAlerts();
  revalidatePath("/admin/alerts");
}

export async function createRule(formData: FormData): Promise<void> {
  await requireManage();
  await prisma.alertRule.create({
    data: {
      name: String(formData.get("name") || "").trim() || "Unnamed rule",
      regionId: int(formData.get("regionId")),
      minScore: int(formData.get("minScore")) ?? 8,
      notifyAuthorities: formData.get("notifyAuthorities") === "on",
      notifyHospitals: formData.get("notifyHospitals") === "on",
      cooldownHours: int(formData.get("cooldownHours")) ?? 24,
      recommendedActions: str(formData.get("recommendedActions")),
    },
  });
  revalidatePath("/admin/alerts");
}

export async function toggleRule(formData: FormData): Promise<void> {
  await requireManage();
  const id = Number(formData.get("id"));
  const r = await prisma.alertRule.findUnique({ where: { id } });
  if (r) await prisma.alertRule.update({ where: { id }, data: { isActive: !r.isActive } });
  revalidatePath("/admin/alerts");
}

export async function deleteRule(formData: FormData): Promise<void> {
  await requireManage();
  await prisma.alertRule.delete({ where: { id: Number(formData.get("id")) } }).catch(() => {});
  revalidatePath("/admin/alerts");
}

export async function createRecipient(formData: FormData): Promise<void> {
  await requireManage();
  await prisma.alertRecipient.create({
    data: {
      name: String(formData.get("name") || "").trim() || "Recipient",
      kind: String(formData.get("kind") || "Authority"),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      regionId: int(formData.get("regionId")),
    },
  });
  revalidatePath("/admin/alerts");
}

export async function deleteRecipient(formData: FormData): Promise<void> {
  await requireManage();
  await prisma.alertRecipient.delete({ where: { id: Number(formData.get("id")) } }).catch(() => {});
  revalidatePath("/admin/alerts");
}

export async function setAlertStatus(formData: FormData): Promise<void> {
  await requireManage();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (["Acknowledged", "Resolved"].includes(status)) {
    await prisma.alert.update({ where: { id }, data: { status } });
  }
  revalidatePath("/admin/alerts");
}
