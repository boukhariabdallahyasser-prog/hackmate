import Link from "next/link";
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
    <section className="shell section">
      <h1>Find teammates</h1>
      <p>
        Explore verified students and see what makes each recommendation
        relevant.
      </p>
      <form action="/community" className="filter">
        <label>
          Search by student or skill
          <input name="q" maxLength={100} defaultValue={search} />
        </label>
        <label>
          University
          <select name="university" defaultValue={university.data ?? ""}>
            <option value="">All universities</option>
            {universities.data?.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Match for an event
          <select name="event" defaultValue={event.data ?? ""}>
            <option value="">Any event</option>
            {events.data?.map((item) => (
              <option value={item.id} key={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <Button>Find teammates</Button>
      </form>
      {event.success && events.data?.some((item) => item.id === event.data) && (
        <ActionForm
          action={toggleEventInterest.bind(
            null,
            event.data,
            interested.has(id),
          )}
          submit={
            interested.has(id)
              ? "Remove my event interest"
              : "Share my interest in this event"
          }
        />
      )}
      {results.length === 0 ? (
        <p className="notice">No matching profiles.</p>
      ) : (
        <div className="event-grid">
          {results.slice(0, 60).map(({ row, data, match }) => (
            <article className="event-card" key={row.id}>
              {httpsUrl(row.avatar_path) && (
                <a
                  className="meta"
                  href={httpsUrl(row.avatar_path)!}
                  rel="noreferrer"
                >
                  Profile picture
                </a>
              )}
              <strong>{row.full_name}</strong>
              <p className="meta">
                @{row.username}{" "}
                {row.university_id &&
                  `· ${universityNames.get(row.university_id) ?? ""}`}
              </p>
              {row.field_of_study && (
                <p>
                  {row.field_of_study} {row.academic_year}
                </p>
              )}
              {row.bio && <p>{row.bio}</p>}
              {row.experience && <p>{row.experience}</p>}
              {data.skills.size > 0 && (
                <p>{[...data.skills.keys()].join(" · ")}</p>
              )}
              {match.reasons.length > 0 && (
                <ul aria-label="Reasons for recommendation">
                  {match.reasons.slice(0, 6).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
              <div className="text-links">
                {[
                  ["GitHub", row.github_url],
                  ["LinkedIn", row.linkedin_url],
                  ["Portfolio", row.portfolio_url],
                ].map(([label, value]) => {
                  const url = httpsUrl(value);
                  return (
                    url && (
                      <a href={url} key={label} rel="noreferrer">
                        {label}
                      </a>
                    )
                  );
                })}
                <Link href={`/teams?invite=${row.id}`}>Invite to a team</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
