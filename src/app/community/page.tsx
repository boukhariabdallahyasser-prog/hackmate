import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Search,
  UsersRound,
} from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { httpsUrl, uuid } from "@/lib/forms";
import { matchTeammate, type MatchProfile } from "@/lib/matching";
import { requireMember } from "@/lib/supabase/server";
import { toggleEventInterest } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Find teammates", robots: { index: false } };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; university?: string; q?: string }>;
}) {
  const { client, id } = await requireMember("verified");
  const params = await searchParams;
  const event = uuid.safeParse(params.event);
  const university = uuid.safeParse(params.university);
  const search =
    typeof params.q === "string"
      ? params.q.trim().slice(0, 100).toLowerCase()
      : "";
  const [
    profiles,
    skills,
    interests,
    events,
    universities,
    eventSkills,
    eventInterests,
  ] = await Promise.all([
    client.from("profiles").select("*").order("username").limit(150),
    client.from("skills").select("id,name"),
    client.from("interests").select("id,name"),
    client
      .from("events")
      .select("id,title")
      .eq("moderation_status", "approved")
      .order("starts_at")
      .limit(100),
    client
      .from("universities")
      .select("id,name")
      .eq("active", true)
      .order("name"),
    event.success
      ? client
          .from("event_skills")
          .select("skill_id")
          .eq("event_id", event.data)
      : null,
    event.success
      ? client
          .from("profile_event_interests")
          .select("profile_id")
          .eq("event_id", event.data)
      : null,
  ]);
  if (
    [
      profiles,
      skills,
      interests,
      events,
      universities,
      eventSkills,
      eventInterests,
    ].some((result) => result?.error)
  ) {
    return (
      <section className="shell section">
        <h1>Find teammates</h1>
        <p role="alert">The directory is temporarily unavailable.</p>
      </section>
    );
  }
  const skillNames = new Map(
    skills.data?.map((skill) => [skill.id, skill.name]),
  );
  const interestNames = new Map(
    interests.data?.map((interest) => [interest.id, interest.name]),
  );
  const universityNames = new Map(
    universities.data?.map((item) => [item.id, item.name]),
  );
  const interested = new Set(
    eventInterests?.data?.map((item) => item.profile_id),
  );
  const rows = profiles.data ?? [];
  const ids = [...new Set([id, ...rows.map((row) => row.id)])];
  const [profileSkills, profileInterests, viewerRow] = await Promise.all([
    client
      .from("profile_skills")
      .select("*")
      .in("profile_id", ids)
      .limit(10000),
    client
      .from("profile_interests")
      .select("*")
      .in("profile_id", ids)
      .limit(10000),
    client.from("profiles").select("*").eq("id", id).maybeSingle(),
  ]);
  if (profileSkills.error || profileInterests.error || viewerRow.error) {
    return (
      <section className="shell section">
        <h1>Find teammates</h1>
        <p role="alert">Recommendations are temporarily unavailable.</p>
      </section>
    );
  }
  function matchData(row: (typeof rows)[number]): MatchProfile {
    return {
      id: row.id,
      university: row.university_id,
      availability: row.availability,
      roles: row.preferred_roles,
      interestedInEvent: interested.has(row.id),
      skills: new Map(
        profileSkills.data
          ?.filter((item) => item.profile_id === row.id)
          .map(
            (item) =>
              [skillNames.get(item.skill_id) ?? "", item.proficiency] as const,
          )
          .filter(([name]) => name),
      ),
      interests: new Set(
        profileInterests.data
          ?.filter((item) => item.profile_id === row.id)
          .map((item) => interestNames.get(item.interest_id) ?? "")
          .filter(Boolean),
      ),
    };
  }
  const viewer = viewerRow.data ? matchData(viewerRow.data) : null;
  const requested = new Set(
    eventSkills?.data
      ?.map((item) => skillNames.get(item.skill_id) ?? "")
      .filter(Boolean),
  );
  const results = rows
    .filter(
      (row) =>
        row.id !== id &&
        row.discoverable &&
        (!university.success || university.data === row.university_id),
    )
    .map((row) => ({ row, data: matchData(row) }))
    .filter(
      ({ row, data }) =>
        !search ||
        [row.full_name, row.username, ...data.skills.keys()].some((label) =>
          label.toLowerCase().includes(search),
        ),
    )
    .map(({ row, data }) => ({
      row,
      data,
      match: viewer
        ? matchTeammate(viewer, data, requested)
        : { score: 0, reasons: [] },
    }))
    .sort(
      (a, b) =>
        b.match.score - a.match.score ||
        a.row.username.localeCompare(b.row.username),
    );
  return (
    <section className="shell section community-page">
      <header className="community-intro">
        <div>
          <p className="section-overline">YOUR NEXT COLLABORATORS</p>
          <h1>Find your people.</h1>
          <p>Meet verified students, compare complementary skills, and find the right teammates for your next challenge.</p>
        </div>
        <span className="community-intro-art" aria-hidden="true"><UsersRound size={39} /></span>
      </header>
      <form action="/community" className="community-filters">
        <label>
          Search by student or skill
          <span className="input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input name="q" type="search" maxLength={100} defaultValue={search} placeholder="Name, skill, or username" />
          </span>
        </label>
        <label>
          University
          <select name="university" defaultValue={university.data ?? ""}>
            <option value="">All universities</option>
            {universities.data?.map((item) => (
              <option value={item.id} key={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Match for an event
          <select name="event" defaultValue={event.data ?? ""}>
            <option value="">Any event</option>
            {events.data?.map((item) => (
              <option value={item.id} key={item.id}>{item.title}</option>
            ))}
          </select>
        </label>
        <Button type="submit">Find teammates <ArrowRight size={16} aria-hidden="true" /></Button>
      </form>
      {event.success && events.data?.some((item) => item.id === event.data) && (
        <div className="interest-panel">
          <div>
            <strong>Interested in this event?</strong>
            <p>Let other verified students know you&apos;re looking to collaborate.</p>
          </div>
          <ActionForm
            action={toggleEventInterest.bind(null, event.data, interested.has(id))}
            submit={interested.has(id) ? "Remove my event interest" : "Share my interest"}
          />
        </div>
      )}
      <div className="community-results-header">
        <div>
          <h2>Student directory</h2>
          <p>{results.length > 60 ? `Showing the first 60 of ${results.length} matches` : `${results.length} matching student${results.length === 1 ? "" : "s"}`}</p>
        </div>
        <span><BadgeCheck size={16} aria-hidden="true" /> Verified member space</span>
      </div>
      {results.length === 0 ? (
        <div className="empty-state">
          <UsersRound size={28} aria-hidden="true" />
          <h3>No matching profiles</h3>
          <p>Try searching by a different skill or explore all universities.</p>
          <Link href="/community" className="empty-action">Clear filters <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="profile-grid">
          {results.slice(0, 60).map(({ row, data, match }) => {
            const initials = row.full_name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((name) => name[0]?.toUpperCase() ?? "")
              .join("");
            return (
              <article className="profile-card" key={row.id}>
                <div className="profile-card-top">
                  <span className="profile-avatar" aria-hidden="true">{initials || "HM"}</span>
                  {data.availability && (
                    <span className={data.availability === "Available" ? "profile-availability available" : "profile-availability"}>
                      {data.availability}
                    </span>
                  )}
                </div>
                <h3>{row.full_name}</h3>
                <p className="profile-handle">@{row.username}</p>
                {row.university_id && (
                  <p className="profile-campus">{universityNames.get(row.university_id) ?? "University student"}</p>
                )}
                {row.field_of_study && (
                  <p className="profile-field">{row.field_of_study} {row.academic_year}</p>
                )}
                {row.bio && <p className="profile-bio">{row.bio}</p>}
                {data.skills.size > 0 && (
                  <div className="profile-skills" aria-label="Student skills">
                    {[...data.skills.keys()].slice(0, 4).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                    {data.skills.size > 4 && <span>+{data.skills.size - 4} more</span>}
                  </div>
                )}
                {match.reasons.length > 0 && (
                  <div className="profile-match">
                    <strong>Why you might connect</strong>
                    <ul aria-label="Reasons for recommendation">
                      {match.reasons.slice(0, 3).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="profile-card-footer">
                  <div className="profile-socials">
                    {[
                      ["GitHub", row.github_url],
                      ["LinkedIn", row.linkedin_url],
                      ["Portfolio", row.portfolio_url],
                    ].map(([label, value]) => {
                      const url = httpsUrl(value);
                      return url ? (
                        <a href={url} key={label} rel="noopener noreferrer" target="_blank">
                          {label}
                        </a>
                      ) : null;
                    })}
                  </div>
                  <Link className="profile-invite" href={`/teams?invite=${row.id}`}>
                    Invite to a team <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
