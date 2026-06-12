import Link from "next/link";
import { PageHead } from "@/components/PageHead";

export default function NotFound() {
  return (
    <>
      <PageHead eyebrow="404" title="Page not found" />
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 560 }}>
        <div className="pa-card">
          <div className="pa-card-body">
            <p style={{ marginTop: 0 }}>We couldn&apos;t find that page or record.</p>
            <Link href="/" className="pa-btn pa-btn-outline"><i className="bi bi-house" /> Back to home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
