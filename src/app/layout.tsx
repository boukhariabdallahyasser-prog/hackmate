import type { Metadata } from "next";
import Link from "next/link";
import { Terminal } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "HackMate — Student tech events in Algeria",
    template: "%s | HackMate",
  },
  description:
    "Discover hackathons, coding competitions and university tech events across Algeria.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" className="brand">
              <span className="brand-icon">
                <Terminal size={18} aria-hidden="true" />
              </span>
              HackMate
            </Link>
            <nav aria-label="Main">
              <Link href="/events">Events</Link>
              <Link href="/about">About</Link>
              <Link href="/account">Account</Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <Link href="/" className="brand">
              HackMate
            </Link>
            <span>For university students across Algeria</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
