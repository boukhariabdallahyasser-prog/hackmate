import Link from "next/link";
import type { ReactNode } from "react";
import { requireMember } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Account", robots: { index: false } };

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { access } = await requireMember();
  const verified = access?.status === "verified";
  return (
    <div className="shell section member-layout">
      <nav aria-label="Account" className="member-nav">
        <Link href="/account">Overview</Link>
        <Link href="/account/notifications">Notifications</Link>
        {verified && (access?.role !== "student" || access.onboarded_at) && (
          <>
            <Link href="/account/profile">Profile</Link>
            <Link href="/account/saved">Saved events</Link>
            <Link href="/account/submissions">My events</Link>
            <Link href="/community">Teammates</Link>
            <Link href="/teams">Teams</Link>
          </>
        )}
        {verified && access?.role !== "student" && (
          <Link href="/staff">Staff</Link>
        )}
      </nav>
      <div className="member-content">{children}</div>
    </div>
  );
}
