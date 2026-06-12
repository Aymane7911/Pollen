import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { FormOk } from "@/components/form";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · UAE Pollen Atlas" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmed?: string }> }) {
  const { confirmed } = await searchParams;
  return (
    <>
      <PageHead eyebrow="Account" title="Sign in" subtitle="Researcher, validator, and administrator access" />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 460 }}>
        {confirmed && <FormOk>Email confirmed. Sign in once an administrator approves your account.</FormOk>}
        <div className="pa-card">
          <div className="pa-card-body">
            <LoginForm />
          </div>
        </div>
        <p className="text-sm text-mute mt-3" style={{ textAlign: "center" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "var(--pa-primary)", fontWeight: 600 }}>
            Register as a contributor
          </Link>
        </p>
      </div>
    </>
  );
}
