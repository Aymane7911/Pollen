import Link from "next/link";
import { statusColor, humanize } from "@/lib/enums";

export function PageHead({
  eyebrow, title, subtitle, children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pa-page-head">
      <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          {eyebrow && <div className="pa-eyebrow">{eyebrow}</div>}
          <h1 className="pa-section-title">{title}</h1>
          {subtitle && <p className="pa-section-subtitle">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="pa-badge" style={{ background: statusColor[status] ?? "#666" }}>
      {humanize(status)}
    </span>
  );
}

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="pa-btn pa-btn-outline">
      <i className="bi bi-arrow-left" /> {label}
    </Link>
  );
}
