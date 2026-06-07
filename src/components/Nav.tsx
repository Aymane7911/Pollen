"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "bi-house", exact: true },
  { href: "/map", label: "Map", icon: "bi-geo-alt" },
  { href: "/species", label: "Species", icon: "bi-tree" },
  { href: "/pollen-types", label: "Pollen", icon: "bi-circle-fill" },
  { href: "/records", label: "Records", icon: "bi-card-list" },
  { href: "/forecast", label: "Forecast", icon: "bi-flower2" },
  { href: "/calendar", label: "Calendar", icon: "bi-calendar3" },
  { href: "/insights", label: "Insights", icon: "bi-bar-chart-line" },
  { href: "/beehives", label: "Apiaries", icon: "bi-hexagon-fill" },
  { href: "/about", label: "About", icon: "bi-info-circle" },
];

export default function Nav() {
  const path = usePathname();
  const isActive = (l: (typeof links)[number]) =>
    l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/");
  return (
    <header className="pa-header">
      <div className="mx-auto max-w-7xl px-4 flex items-center gap-1" style={{ height: 58 }}>
        <Link href="/" className="pa-brand" style={{ marginRight: ".75rem" }}>
          <span className="pa-brand-mark"><i className="bi bi-flower1" /></span>
          <span>Pollen Atlas</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`pa-nav-link ${isActive(l) ? "active" : ""}`}>
              <i className={`bi ${l.icon}`} aria-hidden /> {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
