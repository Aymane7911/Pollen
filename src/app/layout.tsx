import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "UAE Pollen Atlas",
  description: "Pollen monitoring, decision support, and allergy-risk forecasting for the United Arab Emirates.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const navUser = user ? { fullName: user.fullName, role: user.role, isApproved: user.isApproved } : null;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&family=Noto+Kufi+Arabic:wght@400;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Nav user={navUser} />
        <main className="flex-1">{children}</main>
        <footer style={{ borderTop: "1px solid var(--pa-line)", background: "var(--pa-surface)" }}>
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-mute flex flex-wrap gap-3 justify-between">
            <span>UAE Pollen Atlas — Next.js port · decision support for pollen, air quality &amp; allergy risk.</span>
            <span>Atlas dataset · CC BY 4.0</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
