import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { canManage, canValidate, canContribute } from "./roles";

// Session-cookie auth replacing the original ASP.NET Identity cookie scheme. A random
// opaque token is stored in an httpOnly cookie and looked up against the Session table.

const COOKIE = "pa_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    jar.delete(COOKIE);
  }
}

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  affiliation: string | null;
  title: string | null;
  isApproved: boolean;
};

// Cached per request so multiple guards/components share one lookup.
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const u = session.user;
  return {
    id: u.id, email: u.email, fullName: u.fullName, role: u.role,
    affiliation: u.affiliation, title: u.title, isApproved: u.isApproved,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

/** Logged-in + email-confirmed + admin-approved (else routed to /pending). */
export async function requireApproved(): Promise<SessionUser> {
  const u = await requireUser();
  if (!u.isApproved) redirect("/pending");
  return u;
}

export async function requireContribute(): Promise<SessionUser> {
  const u = await requireApproved();
  if (!canContribute(u.role)) redirect("/forbidden");
  return u;
}

export async function requireValidate(): Promise<SessionUser> {
  const u = await requireApproved();
  if (!canValidate(u.role)) redirect("/forbidden");
  return u;
}

export async function requireManage(): Promise<SessionUser> {
  const u = await requireApproved();
  if (!canManage(u.role)) redirect("/forbidden");
  return u;
}
