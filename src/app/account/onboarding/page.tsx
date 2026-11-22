import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { requireMember } from "@/lib/supabase/server";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const { client, id, access } = await requireMember();
  if (access?.status !== "verified" || access.onboarded_at)
    redirect("/account");
  const [{ data: interests, error }, { data: profile }] = await Promise.all([
    client.from("interests").select("id,name").order("name"),
    client
      .from("profiles")
      .select("full_name,username,field_of_study")
      .eq("id", id)
      .maybeSingle(),
  ]);
  return (
    <section className="onboarding-panel">
      <h1>Set up your student profile</h1>
      <p>
        Your account is approved. Choose what you study and what you want to
        explore.
      </p>
      {error || !interests?.length ? (
        <p role="alert">Interests are temporarily unavailable.</p>
      ) : (
        <ActionForm action={completeOnboarding} submit="Open my dashboard">
          <label>
            Full name
            <input
              name="name"
              autoComplete="name"
              defaultValue={profile?.full_name}
              minLength={2}
              maxLength={120}
              required
            />
          </label>
          <label>
            Username
            <input
              name="handle"
              autoComplete="username"
              defaultValue={profile?.username}
              pattern="[a-zA-Z0-9_]{3,30}"
              required
            />
          </label>
          <label>
            Specialization
            <input
              name="field"
              defaultValue={profile?.field_of_study ?? ""}
              placeholder="e.g. Cybersecurity"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <fieldset className="interest-grid">
            <legend>What are you interested in? Choose up to eight.</legend>
            {interests.map((interest) => (
              <label key={interest.id}>
                <input type="checkbox" name="interests" value={interest.id} />
                {interest.name}
              </label>
            ))}
          </fieldset>
        </ActionForm>
      )}
    </section>
  );
}
