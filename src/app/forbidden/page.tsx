import Link from "next/link";
import { PageHead } from "@/components/PageHead";

export const metadata = { title: "Not authorized · UAE Pollen Atlas" };

export default function ForbiddenPage() {
  return (
    <>
      <PageHead eyebrow="403" title="Not authorized" />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 560 }}>
        <div className="pa-card">
          <div className="pa-card-body">
            <p style={{ marginTop: 0 }}>Your role doesn&apos;t have access to this area.</p>
            <Link href="/" className="pa-btn pa-btn-outline">
              <i className="bi bi-house" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
