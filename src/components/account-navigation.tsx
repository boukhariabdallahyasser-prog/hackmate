"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight, Bell, Bookmark, CalendarDays, Compass, LayoutDashboard,
  Settings2, ShieldCheck, UserRound, UsersRound,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  verified?: boolean;
  staff?: boolean;
};

const links: NavItem[] = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: UserRound, verified: true },
  { href: "/account/saved", label: "Saved events", icon: Bookmark, verified: true },
  { href: "/account/submissions", label: "My events", icon: CalendarDays, verified: true },
  { href: "/community", label: "Teammates", icon: UsersRound, verified: true },
  { href: "/teams", label: "Teams", icon: Compass, verified: true },
  { href: "/staff", label: "Staff", icon: Settings2, staff: true },
];

export function AccountNavigation({ memberReady, staff }: { memberReady: boolean; staff: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="member-nav v3-account-nav">
      <div className="v3-account-nav-header">
        <span className="v3-account-nav-avatar" aria-hidden="true"><UserRound size={21} /></span>
        <span><strong>My workspace</strong><small><ShieldCheck size={12} aria-hidden="true" /> Your HackMate space</small></span>
      </div>
      <div className="v3-account-nav-label">YOUR PAGES</div>
      {links.filter(({ verified, staff: staffOnly }) =>
        (!verified || memberReady) && (!staffOnly || staff)).map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link href={href} key={href} aria-current={active ? "page" : undefined} className={active ? "v3-account-nav-active" : ""}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {active && <span className="v3-nav-active-dot" aria-hidden="true" />}
          </Link>
        );
      })}
      <Link href="/events" className="v3-account-nav-explore"><span>Find opportunities</span><ArrowUpRight size={16} aria-hidden="true" /></Link>
    </nav>
  );
}
