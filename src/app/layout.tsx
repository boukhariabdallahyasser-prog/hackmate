import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Compass, Github, Terminal, UsersRound } from "lucide-react";
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
            <Link href="/" className="brand" aria-label="HackMate home">
              <span className="brand-icon">
                <Terminal size={20} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span>hack<span className="brand-accent">mate</span><span className="brand-dot">.</span></span>
            </Link>
            <nav aria-label="Main" className="site-nav">
              <Link href="/events"><Compass size={16} aria-hidden="true" /> Events</Link>
              <Link href="/about">How it works</Link>
              <Link href="/account" className="nav-account"><UsersRound size={16} aria-hidden="true" /> Account <ArrowUpRight size={15} aria-hidden="true" /></Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div>
              <Link href="/" className="brand">hack<span className="brand-accent">mate</span><span className="brand-dot">.</span></Link>
              <p>Discover people. Build great things.</p>
            </div>
            <div className="footer-links">
              <Link href="/events">Explore events</Link>
              <Link href="/about">About</Link>
              <a href="https://github.com/boukhariabdallahyasser-prog/hackmate" target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true" /> GitHub</a>
            </div>
            <span className="footer-credit">Built for students across Algeria</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
