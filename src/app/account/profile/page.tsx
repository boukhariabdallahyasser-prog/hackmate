import { ActionForm } from "@/components/action-form";
import { requireMember } from "@/lib/supabase/server";
import { saveProfile } from "../actions";

export default async function ProfilePage() {
  const { client, id, access } = await requireMember();
  const verified = access?.status === "verified";
  const [
    profileResult,
    skillsResult,
    interestsResult,
    mySkillsResult,
    myInterestsResult,
  ] = await Promise.all([
    client.from("profiles").select("*").eq("id", id).maybeSingle(),
    verified ? client.from("skills").select("*").order("name") : null,
    verified ? client.from("interests").select("*").order("name") : null,
    verified
      ? client
          .from("profile_skills")
          .select("skill_id,proficiency")
          .eq("profile_id", id)
      : null,
    verified
      ? client
          .from("profile_interests")
          .select("interest_id")
          .eq("profile_id", id)
      : null,
  ]);
  if (
    [
      profileResult,
      skillsResult,
      interestsResult,
      mySkillsResult,
      myInterestsResult,
    ].some((result) => result?.error)
  ) {
    return (
      <section>
        <h1>Student profile</h1>
        <p role="alert">Your profile is temporarily unavailable.</p>
      </section>
    );
  }
  const profile = profileResult.data;
  const mySkills = new Map(
    mySkillsResult?.data?.map((skill) => [skill.skill_id, skill.proficiency]),
  );
  const myInterests = new Set(
    myInterestsResult?.data?.map((interest) => interest.interest_id),
  );
  return (
    <section className="form-page">
      <h1>Student profile</h1>
      <ActionForm action={saveProfile} submit="Save profile">
        <label>
          Full name
          <input
            name="full_name"
            defaultValue={profile?.full_name}
            required
            maxLength={120}
          />
        </label>
        <label>
          Username
          <input
            name="username"
            defaultValue={profile?.username}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]{3,30}"
          />
        </label>
        <label>
          Bio
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ""}
            maxLength={1000}
          />
        </label>
        <label>
          Experience
          <textarea
            name="experience"
            defaultValue={profile?.experience ?? ""}
            maxLength={2000}
          />
        </label>
        <label>
          Availability
          <select
            name="availability"
            defaultValue={profile?.availability ?? ""}
          >
            <option value="">Choose availability</option>
            <option>Available</option>
            <option>Limited</option>
            <option>Unavailable</option>
          </select>
        </label>
        <label>
          Preferred roles
          <input
            name="preferred_roles"
            defaultValue={profile?.preferred_roles.join(", ")}
            maxLength={500}
            placeholder="Frontend, design, data"
          />
        </label>
        <label>
          Profile picture URL
          <input
            type="url"
            name="avatar_path"
            defaultValue={profile?.avatar_path ?? ""}
            maxLength={400}
          />
        </label>
        <label>
          GitHub URL
          <input
            type="url"
            name="github_url"
            defaultValue={profile?.github_url ?? ""}
            maxLength={400}
          />
        </label>
        <label>
          LinkedIn URL
          <input
            type="url"
            name="linkedin_url"
            defaultValue={profile?.linkedin_url ?? ""}
            maxLength={400}
          />
        </label>
        <label>
          Portfolio URL
          <input
            type="url"
            name="portfolio_url"
            defaultValue={profile?.portfolio_url ?? ""}
            maxLength={400}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            name="discoverable"
            defaultChecked={profile?.discoverable ?? true}
          />
          Show my profile to verified members
        </label>
        {!!skillsResult?.data?.length && (
          <fieldset>
            <legend>Skills and proficiency</legend>
            {skillsResult.data.map((skill) => (
              <label key={skill.id}>
                {skill.name}
                <select
                  name={`skill:${skill.id}`}
                  defaultValue={mySkills.get(skill.id) ?? ""}
                >
                  <option value="">Not selected</option>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
        )}
        {!!interestsResult?.data?.length && (
          <fieldset>
            <legend>Interests</legend>
            {interestsResult.data.map((interest) => (
              <label className="checkbox" key={interest.id}>
                <input
                  type="checkbox"
                  name="interests"
                  value={interest.id}
                  defaultChecked={myInterests.has(interest.id)}
                />
                {interest.name}
              </label>
            ))}
          </fieldset>
        )}
      </ActionForm>
    </section>
  );
}
