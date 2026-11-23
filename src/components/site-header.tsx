"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Compass, Menu, Sparkles, UsersRound, UserRound, X } from "lucide-react";
import { CommandSearch } from "@/components/command-search";

const nav = [
  { href: "/events", label: "Explore", icon: Compass },
  { href: "/teams", label: "Teams", icon: UsersRound },
  { href: "/community", label: "Community", icon: Sparkles },
  { href: "/about", label: "How it works", icon: CalendarDays },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="site-topline">
        <div className="shell site-topline-inner">
          <span className="topline-beacon" aria-hidden="true" />
          <span>Built for the next generation of Algerian makers</span>
          <Link href="/events?upcoming=1">Discover opportunities <ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="shell header-inner">
        <Link href="/" className="brand brand-v3" aria-label="HackMate home" onClick={() => setMenuOpen(false)}>
          <span className="brand-emblem" aria-hidden="true"><span>h</span><span className="brand-emblem-star">✳</span></span>
          <span>hack<span className="brand-accent">mate</span><span className="brand-dot">.</span></span>
        </Link>
        <nav className="site-nav-v3" aria-label="Main navigation">
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className={pathname === href || (pathname.startsWith(href + "/") && href !== "/about") ? "nav-active" : ""}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <CommandSearch />
          <Link href="/account" className="header-account" aria-label="My space"><UserRound size={18} aria-hidden="true" /><span>My space</span><ArrowUpRight className="header-account-arrow" size={16} aria-hidden="true" /></Link>
          <button type="button" className="mobile-menu-trigger" onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-controls="mobile-navigation" aria-expanded={menuOpen}>
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className={menuOpen ? "mobile-navigation mobile-navigation-open" : "mobile-navigation"} inert={!menuOpen}>
        <div className="shell mobile-navigation-inner">
          <span className="menu-eyebrow">EXPLORE HACKMATE</span>
          {nav.map(({ href, label, icon: Icon }, index) => (
            <Link href={href} key={href} onClick={() => setMenuOpen(false)}>
              <span className="mobile-nav-num">0{index + 1}</span>
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          ))}
          <Link href="/account" className="mobile-account-link" onClick={() => setMenuOpen(false)}>
            Open your student workspace <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
          <p>Made for student builders, dreamers and doers.</p>
        </div>
      </nav>
    </header>
  );
}
