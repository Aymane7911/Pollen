// Bootstraps the first Administrator so the authenticated app can be used. Idempotent.
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = "admin@pollenatlas.ae";
  const password = "Admin!2026";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      fullName: "Atlas Administrator",
      title: "System Administrator",
      role: "Administrator",
      emailConfirmed: true,
      isApproved: true,
      isActive: true,
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`Created administrator → ${email} / ${password}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
