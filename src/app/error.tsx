"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <div className="pa-page-head">
        <div className="mx-auto max-w-7xl px-4">
          <div className="pa-eyebrow">Something went wrong</div>
          <h1 className="pa-section-title">An unexpected error occurred</h1>
        </div>
      </div>
      <div className="mx-auto px-4 pa-content" style={{ maxWidth: 560 }}>
        <div className="pa-card">
          <div className="pa-card-body">
            <p style={{ marginTop: 0 }}>The page hit an error while loading. You can retry, or head back home.</p>
            <div className="flex gap-2">
              <button onClick={reset} className="pa-btn pa-btn-primary"><i className="bi bi-arrow-clockwise" /> Try again</button>
              <Link href="/" className="pa-btn pa-btn-outline"><i className="bi bi-house" /> Home</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
