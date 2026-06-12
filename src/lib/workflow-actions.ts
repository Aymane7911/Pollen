"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";
import { canValidate, canContribute } from "./roles";
import { TRANSITIONS } from "./workflow";

// Validation workflow transition. Each transition writes a ValidationLog row — the same
// audit trail the 1,297 imported log rows belong to.
export async function transitionRecord(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.isApproved) redirect("/login");

  const recordId = Number(formData.get("recordId"));
  const toStatus = String(formData.get("toStatus") || "");
  const comment = String(formData.get("comment") || "").trim() || null;

  const record = await prisma.pollenRecord.findUnique({ where: { id: recordId } });
  if (!record) redirect("/review");

  const allowed = (TRANSITIONS[record.status] ?? []).find((t) => t.to === toStatus);
  if (!allowed) redirect(`/records/${recordId}`);

  const isOwner = record.collectorId === user.id;
  const ownerless = record.collectorId === null; // imported/legacy records carry no collector
  // Validate-path transitions need a validator; contribute-path transitions need the owner
  // (or any approved contributor for ownerless legacy records) — a validator cannot submit
  // someone else's private draft in their name.
  const permitted =
    allowed!.need === "validate"
      ? canValidate(user.role)
      : canContribute(user.role) && (isOwner || ownerless);
  if (!permitted) redirect("/forbidden");

  await prisma.$transaction([
    prisma.pollenRecord.update({
      where: { id: recordId },
      data: {
        status: toStatus,
        // validatedAt holds only while Validated/Published; rejectionReason only while Rejected
        // — both cleared when the record moves elsewhere, so stale values can't linger.
        validatedAt: toStatus === "Validated" || toStatus === "Published" ? new Date() : null,
        rejectionReason: toStatus === "Rejected" ? comment : null,
      },
    }),
    prisma.validationLog.create({
      data: {
        pollenRecordId: recordId,
        fromStatus: record.status,
        toStatus,
        actorId: user.id,
        actorName: user.fullName,
        comment,
      },
    }),
  ]);

  revalidatePath(`/records/${recordId}`);
  revalidatePath("/review");
  redirect(`/records/${recordId}`);
}
