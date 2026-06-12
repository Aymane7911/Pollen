import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { prisma } from "@/lib/db";
import { confirmAction } from "@/lib/auth-actions";

export const metadata = { title: "Confirm email · UAE Pollen Atlas" };

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = token ? await prisma.user.findUnique({ where: { emailConfirmToken: token } }) : null;

  return (
    <>
      <PageHead eyebrow="Account" title="Confirm email" />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 460 }}>
        <div className="pa-card">
          <div className="pa-card-body">
            {!token ? (
              <p className="text-sm" style={{ margin: 0 }}>Missing confirmation token.</p>
            ) : !user ? (
              <p className="text-sm" style={{ margin: 0 }}>
                This confirmation link is invalid or has already been used.{" "}
                <Link href="/login" style={{ color: "var(--pa-primary)", fontWeight: 600 }}>Sign in</Link>.
              </p>
            ) : (
              <form action={confirmAction}>
                <input type="hidden" name="token" value={token} />
                <p className="text-sm" style={{ marginTop: 0 }}>
                  Confirm <strong>{user.email}</strong> for {user.fullName}.
                </p>
                <button type="submit" className="pa-btn pa-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <i className="bi bi-check2-circle" /> Confirm my email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
