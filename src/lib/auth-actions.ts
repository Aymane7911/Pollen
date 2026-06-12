"use server";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroySession } from "./auth";
import { credentialExt, writeCredential, CREDENTIAL_MAX_BYTES } from "./credentials";

export type AuthState = { error?: string; ok?: boolean; confirmUrl?: string };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Email and password are required." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  if (!user.isActive) return { error: "This account has been deactivated." };
  if (!user.emailConfirmed) {
    return { error: "Please confirm your email address first (use the confirmation link from registration)." };
  }
  await createSession(user.id);
  redirect("/");
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") || "").trim();
  const affiliation = String(formData.get("affiliation") || "").trim() || null;
  const password = String(formData.get("password") || "");
  // Self-selected role is a REQUEST only — whitelist to Researcher/Expert (never grant
  // Administrator via the form); an admin still approves and can change it.
  const role = String(formData.get("role") || "") === "Expert" ? "Expert" : "Researcher";

  if (!email || !fullName || !password) return { error: "Name, email, and password are required." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists." };
  }

  // Optional credential document (CV / certificate / ID) for the admin to review before
  // approving. Stored privately; validated for type + size.
  const credFile = formData.get("credential");
  let credentialPath: string | null = null;
  if (credFile instanceof File && credFile.size > 0) {
    if (credFile.size > CREDENTIAL_MAX_BYTES) return { error: "Credential file must be under 10 MB." };
    const ext = credentialExt(credFile.name);
    if (!ext) return { error: "Credential must be a PDF, image (jpg/png/webp), or Word document." };
    credentialPath = await writeCredential(credFile, ext);
  }

  const token = randomBytes(24).toString("hex");
  await prisma.user.create({
    data: {
      email, fullName, affiliation, role, credentialPath,
      passwordHash: await hashPassword(password), emailConfirmToken: token,
    },
  });
  // No SMTP is configured in this build (the original logged the link too), so the
  // confirmation link is surfaced directly to the registrant instead of emailed.
  return { ok: true, confirmUrl: `/confirm?token=${token}` };
}

export async function confirmAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") || "");
  if (token) {
    const user = await prisma.user.findUnique({ where: { emailConfirmToken: token } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailConfirmed: true, emailConfirmToken: null },
      });
    }
  }
  redirect("/login?confirmed=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
