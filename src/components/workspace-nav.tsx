"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck2,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  UserRound,
  Workflow,
} from "lucide-react";

const entries = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, group: "account" },
  { href: "/account/notifications", label: "Notifications", icon: Bell, group: "account" },
  { href: "/account/profile", label: "My profile", icon: UserRound, group: "workspace" },
  { href: "/account/submissions", label: "My events", icon: CalendarCheck2, group: "workspace" },
  { href: "/community", label: "Teammates", icon: UsersRound, group: "workspace" },
  { href: "/teams", label: "My teams", icon: Workflow, group: "workspace" },
  { href: "/staff", label: "Staff dashboard", icon: ShieldCheck, group: "staff" },
] as const;

export function WorkspaceNav({
  canBrowse,
  staff,
}: {
  canBrowse: boolean;
  staff: boolean;
}) {
  const pathname = usePathname();
  const visible = entries.filter(
    (item) =>
      item.group === "account" ||
      (item.group === "workspace" && canBrowse) ||
      (item.group === "staff" && staff),
  );
  return (
    <nav aria-label="Account" className="member-nav">
      <div className="member-nav-heading">
        <span className="member-nav-kicker">YOUR SPACE</span>
        <strong>Workspace</strong>
      </div>
      {visible.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== "/account" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={active ? "member-nav-link active" : "member-nav-link"}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
