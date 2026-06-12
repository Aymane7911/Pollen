"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { requireManage } from "./auth";
import { ROLES } from "./roles";

export async function approveUser(formData: FormData): Promise<void> {
  await requireManage();
  const id = String(formData.get("userId"));
  await prisma.user.update({ where: { id }, data: { isApproved: true } });
  revalidatePath("/admin/users");
}

export async function setUserRole(formData: FormData): Promise<void> {
  await requireManage();
  const id = String(formData.get("userId"));
  const role = String(formData.get("role"));
  if ((ROLES as readonly string[]).includes(role)) {
    await prisma.user.update({ where: { id }, data: { role } });
  }
  revalidatePath("/admin/users");
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const admin = await requireManage();
  const id = String(formData.get("userId"));
  if (id === admin.id) return; // never lock yourself out
  const u = await prisma.user.findUnique({ where: { id } });
  if (u) await prisma.user.update({ where: { id }, data: { isActive: !u.isActive } });
  revalidatePath("/admin/users");
}
