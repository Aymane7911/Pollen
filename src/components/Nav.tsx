"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";
import { canContribute, canValidate, canManage } from "@/lib/roles";

type NavUser = { fullName: string; role: string; isApproved: boolean } | null;
type NavLink = { href: string; label: string; icon: string; exact?: boolean };

const PUBLIC: NavLink[] = [
  { href: "/", label: "Home", icon: "bi-house", exact: true },
  { href: "/map", label: "Map", icon: "bi-geo-alt" },
  { href: "/species", label: "Plants", icon: "bi-tree" },
  { href: "/pollen-types", label: "Pollen", icon: "bi-circle-fill" },
  { href: "/calendar", label: "Calendar", icon: "bi-calendar3" },
  { href: "/alerts", label: "Alerts", icon: "bi-bell" },
  { href: "/about", label: "About", icon: "bi-info-circle" },
  { href: "/help", label: "Help", icon: "bi-question-circle" },
];

// Data pages restricted to signed-in contributors / experts / admins.
const CONTRIB: NavLink[] = [
  { href: "/records", label: "Records", icon: "bi-card-list" },
  { href: "/forecast", label: "Forecast", icon: "bi-flower2" },
  { href: "/insights", label: "Insights", icon: "bi-bar-chart-line" },
  { href: "/beehives", label: "Apiaries", icon: "bi-hexagon-fill" },
];

export default function Nav({ user }: { user: NavUser }) {
  const path = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path === href || path.startsWith(href + "/");

  const isContrib = !!user?.isApproved && canContribute(user.role);

  // Main nav: public links, with the gated data pages slotted into their usual spots
  // only for contributors+.
  const main: NavLink[] = [
    PUBLIC[0], PUBLIC[1], PUBLIC[2], PUBLIC[3],
    ...(isContrib ? [CONTRIB[0], CONTRIB[1]] : []), // Records, Forecast
    PUBLIC[4], // Calendar
    ...(isContrib ? [CONTRIB[2], CONTRIB[3]] : []), // Insights, Apiaries
    PUBLIC[5], // Alerts
    PUBLIC[6], // About
    PUBLIC[7], // Help
  ];

  const authedLinks: NavLink[] = [];
  if (isContrib) authedLinks.push({ href: "/contribute", label: "Contribute", icon: "bi-plus-square" });
  if (user?.isApproved && canValidate(user.role)) authedLinks.push({ href: "/review", label: "Review", icon: "bi-clipboard-check" });
  if (user?.isApproved && canManage(user.role)) authedLinks.push({ href: "/admin", label: "Admin", icon: "bi-shield-lock" });

  return (
    <header className="pa-header">
      <div className="mx-auto max-w-7xl px-4 flex items-center gap-1" style={{ height: 58 }}>
        <Link href="/" className="pa-brand" style={{ marginRight: ".75rem" }}>
          <span className="pa-brand-mark"><i className="bi bi-flower1" /></span>
          <span>Pollen Atlas</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {main.map((l) => (
            <Link key={l.href} href={l.href} className={`pa-nav-link ${isActive(l.href, l.exact) ? "active" : ""}`}>
              <i className={`bi ${l.icon}`} aria-hidden /> {l.label}
            </Link>
          ))}
          {authedLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`pa-nav-link ${isActive(l.href) ? "active" : ""}`} style={{ color: "var(--pa-primary)" }}>
              <i className={`bi ${l.icon}`} aria-hidden /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          {user ? (
            <>
              <span className="pa-pill pa-pill-mute" title={user.role}>
                <i className="bi bi-person-circle" /> {user.fullName.split(" ")[0]}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="pa-nav-link" title="Sign out" aria-label="Sign out" style={{ background: "none", border: "none", cursor: "pointer" }}>
                  <i className="bi bi-box-arrow-right" />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="pa-nav-link">
              <i className="bi bi-box-arrow-in-right" /> Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
