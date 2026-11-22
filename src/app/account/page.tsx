import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/supabase/server";

export default async function AccountPage() {
  const { client, id, access } = await requireMember();
  const [{ data: profile }, { data: announcement }] = await Promise.all([
    client.from("profiles").select("full_name").eq("id", id).maybeSingle(),
    client
      .from("platform_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle(),
  ]);
  return (
    <section className="form-page">
      <h1>
        {profile ? `Welcome, ${profile.full_name}` : "Your HackMate account"}
      </h1>
      {announcement?.value && <p className="notice">{announcement.value}</p>}
      {access?.status === "verified" ? (
        <p>
          You’re verified. You can join teams, find teammates, and submit
          events.
        </p>
      ) : (
        <p>
          Complete your profile and request student verification to unlock
          member features.
        </p>
      )}
      <div className="text-links">
        <Link href="/account/profile">
          {profile ? "Edit profile" : "Create profile"}
        </Link>
        <Link href="/account/verification">Verification status</Link>
      </div>
      <form action={signOut}>
        <Button>Sign out</Button>
      </form>
    </section>
  );
}
