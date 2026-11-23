import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Bolt,
  CalendarDays,
  UsersRound,
} from "lucide-react";
import { MobileMenu } from "@/components/mobile-menu";
import "./globals.css";
import "./design.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "HackMate | Find events. Find your team.",
    template: "%s | HackMate",
  },
  description:
    "Discover student hackathons and technology events in Algeria, meet verified collaborators, and build a team for your next challenge.",
};

const links = [
  { href: "/events", label: "Explore events" },
  { href: "/community", label: "Find teammates" },
  { href: "/teams", label: "Teams" },
  { href: "/about", label: "How it works" },
];

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
            <Link href="/" className="brand" aria-label="HackMate home">
              <span className="brand-icon">
                <Bolt size={20} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <span>Hack<span className="brand-accent">Mate</span></span>
            </Link>
            <nav className="desktop-nav" aria-label="Main">
              {links.map(({ href, label }) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className="header-actions">
              <Link className="header-account" href="/account">
                Account
              </Link>
              <Link className="header-join" href="/auth/register">
                Join HackMate <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <MobileMenu links={links} />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div className="footer-about">
              <Link href="/" className="brand">
                <span className="brand-icon">
                  <Bolt size={18} aria-hidden="true" />
                </span>
                <span>Hack<span className="brand-accent">Mate</span></span>
              </Link>
              <p>Where Algeria&apos;s student builders find their next challenge and the people to take it on with.</p>
            </div>
            <div className="footer-nav-group">
              <strong>Explore</strong>
              <Link href="/events"><CalendarDays size={15} aria-hidden="true" /> Events</Link>
              <Link href="/community"><UsersRound size={15} aria-hidden="true" /> Teammates</Link>
              <Link href="/teams">Build a team</Link>
            </div>
            <div className="footer-nav-group">
              <strong>HackMate</strong>
              <Link href="/about">About the platform</Link>
              <Link href="/auth/register">Student registration</Link>
              <Link href="/account">My account</Link>
            </div>
          </div>
          <div className="shell footer-bottom">
            <span>© {new Date().getFullYear()} HackMate. Built for student builders.</span>
            <span>Made for universities across Algeria.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
