"use server";
import { prisma } from "./db";

// Public self-service alert subscription. Creates (or updates) an AlertRecipient of kind
// "Public" — which evaluateAlerts() then notifies whenever a region's risk crosses a rule
// threshold. No login required; deduped by email.
export type SubscribeState = { ok?: boolean; error?: string; region?: string };

export async function subscribeToAlerts(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  // Honeypot — bots fill hidden fields. Pretend success and write nothing.
  if (String(formData.get("website") || "").trim()) return { ok: true };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const regionIdRaw = String(formData.get("regionId") || "").trim();
  const regionId = regionIdRaw ? parseInt(regionIdRaw, 10) : null;

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email address." };

  const region = regionId != null
    ? await prisma.region.findUnique({ where: { id: regionId }, select: { name: true } })
    : null;

  const data = { name: name || email, kind: "Public", email, phone, regionId, isActive: true };
  const existing = await prisma.alertRecipient.findFirst({ where: { email, kind: "Public" } });
  if (existing) await prisma.alertRecipient.update({ where: { id: existing.id }, data });
  else await prisma.alertRecipient.create({ data });

  return { ok: true, region: region?.name ?? "all of the UAE" };
}
