import type { ReactNode } from "react";
import { WorkspaceNav } from "@/components/workspace-nav";
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
  const canBrowse = verified && (access?.role !== "student" || !!access.onboarded_at);
  const staff = verified && access?.role !== "student";
  return (
    <div className="shell section member-layout">
      <WorkspaceNav canBrowse={canBrowse} staff={staff} />
      <div className="member-content">{children}</div>
    </div>
  );
}
