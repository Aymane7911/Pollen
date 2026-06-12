import { redirect } from "next/navigation";
import { PageHead } from "@/components/PageHead";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Awaiting approval · UAE Pollen Atlas" };

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.isApproved) redirect("/");

  return (
    <>
      <PageHead eyebrow="Account" title="Awaiting approval" />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 560 }}>
        <div className="pa-card">
          <div className="pa-card-body">
            <p style={{ marginTop: 0 }}>
              Thanks, {user.fullName}. Your email is confirmed and your account is now awaiting administrator approval.
            </p>
            <p className="text-sm text-mute" style={{ marginBottom: 0 }}>
              Once approved you&apos;ll be able to contribute records and — depending on your role — validate submissions.
              You can keep browsing all public pages in the meantime.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
