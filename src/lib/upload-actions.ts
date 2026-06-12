"use server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { requireContribute } from "./auth";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff"]);

export async function uploadPollenImage(formData: FormData): Promise<void> {
  await requireContribute();
  const pollenTypeId = Number(formData.get("pollenTypeId"));
  const file = formData.get("file") as File | null;
  if (!pollenTypeId) redirect("/pollen-types");
  if (!file || file.size === 0) redirect(`/pollen-types/${pollenTypeId}`);
  if (file.size > 5 * 1024 * 1024) redirect(`/pollen-types/${pollenTypeId}`); // 5 MB cap (DoS guard)

  const ext = (file.name.match(/\.[A-Za-z0-9]+$/)?.[0] || "").toLowerCase();
  if (!ALLOWED.has(ext)) redirect(`/pollen-types/${pollenTypeId}`);

  const name = `${randomBytes(8).toString("hex")}${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "contributed");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  await prisma.pollenImage.create({
    data: {
      pollenTypeId,
      filePath: `/uploads/contributed/${name}`,
      caption: String(formData.get("caption") || "").trim() || null,
      microscope: String(formData.get("microscope") || "LightMicroscopy"),
      isValidated: false,
    },
  });

  revalidatePath(`/pollen-types/${pollenTypeId}`);
  redirect(`/pollen-types/${pollenTypeId}`);
}
