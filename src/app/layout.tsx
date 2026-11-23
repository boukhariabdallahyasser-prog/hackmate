import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Github, Heart, Mail, Zap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MotionLayer } from "@/components/motion-layer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "HackMate | Where the next thing begins",
    template: "%s | HackMate",
  },
  description: "Discover hackathons, competitions and student tech events across Algeria. Find your team, join the challenge, build something real.",
  openGraph: {
    title: "HackMate | Where the next thing begins",
    description: "The home for ambitious Algerian student builders. Discover events, meet teammates, build what matters.",
    siteName: "HackMate",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <MotionLayer />
        <main id="main">{children}</main>
        <footer className="site-footer footer-v3">
          <div className="shell">
            <div className="footer-v3-top">
              <div>
                <div className="footer-v3-eyebrow"><span className="footer-live-dot" aria-hidden="true" /> YOUR NEXT CHAPTER IS CALLING</div>
                <h2>Big things start<br />with <em>showing up.</em></h2>
                <Link href="/events?upcoming=1" className="footer-v3-cta">Find your next event <ArrowUpRight size={19} aria-hidden="true" /></Link>
              </div>
              <div className="footer-v3-symbol" aria-hidden="true"><span>h</span><Zap size={70} /></div>
            </div>
            <div className="footer-v3-columns">
              <div className="footer-v3-about">
                <Link href="/" className="brand brand-v3"><span className="footer-small-emblem">✳</span>hack<span className="brand-accent">mate</span><span className="brand-dot">.</span></Link>
                <p>Discover opportunities. Find your people. Build what&apos;s next. Made for the curious minds of Algeria.</p>
              </div>
              <div className="footer-v3-links">
                <strong>EXPLORE</strong>
                <Link href="/events">All events</Link>
                <Link href="/events?category=hackathon">Hackathons</Link>
                <Link href="/events?upcoming=1">Upcoming events</Link>
                <Link href="/about">How it works</Link>
              </div>
              <div className="footer-v3-links">
                <strong>CONNECT</strong>
                <Link href="/teams">Find a team</Link>
                <Link href="/community">Community</Link>
                <Link href="/account">Your workspace</Link>
                <Link href="/auth/register">Create account</Link>
              </div>
              <div className="footer-v3-links">
                <strong>PROJECT</strong>
                <a href="https://github.com/boukhariabdallahyasser-prog/hackmate" rel="noreferrer" target="_blank"><Github size={16} aria-hidden="true" /> Open source <ArrowUpRight size={14} aria-hidden="true" /></a>
                <Link href="/about"><Mail size={16} aria-hidden="true" /> About us</Link>
                <span>Designed for student builders.</span>
              </div>
            </div>
            <div className="footer-v3-bottom">
              <span>© {new Date().getFullYear()} HackMate. Made with <Heart size={13} aria-label="care" /> for ambitious minds.</span>
              <span>BUILD LOCAL. THINK GLOBAL. <span aria-hidden="true">✳</span></span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
