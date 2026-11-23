import { AccountNavigation } from "@/components/account-navigation";
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
      <AccountNavigation memberReady={Boolean(verified && (access?.role !== "student" || access.onboarded_at))} staff={Boolean(verified && access?.role !== "student")} />
      <div className="member-content">{children}</div>
    </div>
  );
}
