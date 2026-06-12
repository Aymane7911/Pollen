import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManage } from "@/lib/roles";
import { CREDENTIALS_DIR, CREDENTIAL_MIME } from "@/lib/credentials";

// Admin-only: stream a registrant's uploaded credential document. Route handlers are NOT
// covered by the /admin layout guard, so the authorization check is enforced here.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!canManage(me?.role)) return new NextResponse("Forbidden", { status: 403 });

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id }, select: { credentialPath: true } });
  if (!target?.credentialPath) return new NextResponse("Not found", { status: 404 });

  // credentialPath is a generated filename; sanitise anyway to defeat path traversal.
  const safe = target.credentialPath.replace(/[^A-Za-z0-9._-]/g, "");
  const buf = await readFile(join(CREDENTIALS_DIR, safe)).catch(() => null);
  if (!buf) return new NextResponse("Not found", { status: 404 });

  const ext = extname(safe).toLowerCase();
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": CREDENTIAL_MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="credential${ext}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
