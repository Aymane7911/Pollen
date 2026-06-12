import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Register · UAE Pollen Atlas" };

export default function RegisterPage() {
  return (
    <>
      <PageHead eyebrow="Account" title="Register" subtitle="Apply for contributor access" />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 460 }}>
        <div className="pa-card">
          <div className="pa-card-body">
            <RegisterForm />
          </div>
        </div>
        <p className="text-sm text-mute mt-3" style={{ textAlign: "center" }}>
          Already registered?{" "}
          <Link href="/login" style={{ color: "var(--pa-primary)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
        <p className="text-xs text-mute mt-2" style={{ textAlign: "center" }}>
          New accounts start as <strong>Researcher</strong> (contributor) and require email confirmation + admin approval.
        </p>
      </div>
    </>
  );
}
