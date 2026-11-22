import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { uuid } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";
import { saveTeam, updateTeam } from "./actions";
import { TeamFields } from "./team-fields";

export const dynamic = "force-dynamic";

export const metadata = { title: "Teams", robots: { index: false } };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; invite?: string }>;
}) {
  const { client, id } = await requireMember("verified");
  const params = await searchParams;
  const selectedEvent = uuid.safeParse(params.event);
  const selectedInvite = uuid.safeParse(params.invite);
  const [teams, events, skills, invited, applications, owned, nominee] =
    await Promise.all([
      client
        .from("teams")
        .select(
          "id,name,description,event_id,leader_id,recruitment_open,open_positions,visibility",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("events")
        .select("id,title,min_team_size,max_team_size")
        .eq("moderation_status", "approved")
        .order("starts_at")
        .limit(100),
      client.from("skills").select("id,name").order("name"),
      client
        .from("team_invitations")
        .select("id,team_id,status")
        .eq("recipient_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("team_applications")
        .select("id,team_id,status")
        .eq("applicant_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      client
        .from("teams")
        .select("id,name")
        .eq("leader_id", id)
        .order("name")
        .limit(100),
      selectedInvite.success
        ? client
            .from("profiles")
            .select("id,full_name,discoverable")
            .eq("id", selectedInvite.data)
            .maybeSingle()
        : null,
    ]);
  if (
    [teams, events, skills, invited, applications, owned, nominee].some(
      (result) => result?.error,
    )
  )
    return (
      <section className="shell section">
        <h1>Teams</h1>
        <p role="alert">Team data is temporarily unavailable.</p>
      </section>
    );
  const eventNames = new Map(
    events.data?.map((event) => [event.id, event.title]),
  );
  const teamNames = new Map(teams.data?.map((team) => [team.id, team.name]));
  const current = events.data?.find((event) => event.id === selectedEvent.data);
  const visibleTeams =
    teams.data?.filter(
      (team) => !selectedEvent.success || team.event_id === selectedEvent.data,
    ) ?? [];
  return (
    <section className="shell section member-content">
      <h1>{current ? `Teams for ${current.title}` : "Event teams"}</h1>
      {!!params.event && (
        <Link className="underlined" href="/teams">
          Browse all teams
        </Link>
      )}
      {selectedInvite.success && (
        <div className="notice form-page">
          <h2>Invite a teammate</h2>
          {!nominee?.data?.discoverable ? (
            <p>This student is unavailable.</p>
          ) : !owned.data?.length ? (
            <p>Create a team before sending an invitation.</p>
          ) : (
            <>
              <p>Invite {nominee.data.full_name} to a team you lead.</p>
              <ul className="card-list">
                {owned.data.map((team) => (
                  <li key={team.id}>
                    <ActionForm
                      action={updateTeam.bind(null, "invite", team.id)}
                      submit={`Invite to ${team.name}`}
                    >
                      <input
                        type="hidden"
                        name="recipient"
                        value={nominee.data?.id}
                      />
                    </ActionForm>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {!!invited.data?.length && (
        <div className="card-list">
          <h2>Invitations</h2>
          {invited.data.map((invite) => (
            <article className="notice" key={invite.id}>
              <Link className="underlined" href={`/teams/${invite.team_id}`}>
                {teamNames.get(invite.team_id) ?? "View invited team"}
              </Link>
              <p className="meta">{invite.status}</p>
              {invite.status === "pending" && (
                <ActionForm
                  action={updateTeam.bind(null, "invitation", invite.id)}
                  submit="Respond to invitation"
                >
                  <label>
                    Decision
                    <select name="decision">
                      <option value="accept">Accept</option>
                      <option value="reject">Decline</option>
                    </select>
                  </label>
                </ActionForm>
              )}
            </article>
          ))}
        </div>
      )}
      {!!applications.data?.length && (
        <div className="card-list">
          <h2>My join requests</h2>
          {applications.data.map((application) => (
            <p className="notice" key={application.id}>
              {teamNames.get(application.team_id) ?? "Team"} ·{" "}
              {application.status}
            </p>
          ))}
        </div>
      )}
      {visibleTeams.length ? (
        <div className="event-grid">
          {visibleTeams.map((team) => (
            <Link
              href={`/teams/${team.id}`}
              className="event-card"
              key={team.id}
            >
              <strong>{team.name}</strong>
              <p className="meta">
                {eventNames.get(team.event_id)}
                {team.leader_id === id && " · You lead this team"}
              </p>
              <p>{team.open_positions || team.description}</p>
              <span>
                {team.recruitment_open && team.visibility === "members"
                  ? "Recruiting"
                  : "Invitation only or closed"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="notice">No teams match this view.</p>
      )}
      {!!events.data?.length && (
        <details className="notice form-page">
          <summary>Create a team</summary>
          <ActionForm action={saveTeam.bind(null, null)} submit="Create team">
            <label>
              Event
              <select name="event" required defaultValue={current?.id ?? ""}>
                <option value="" disabled>
                  Choose an event
                </option>
                {events.data.map((event) => (
                  <option value={event.id} key={event.id}>
                    {event.title} ({event.min_team_size}–{event.max_team_size}{" "}
                    members)
                  </option>
                ))}
              </select>
            </label>
            <label>
              Maximum team size
              <input
                name="capacity"
                type="number"
                min={1}
                max={100}
                defaultValue={current?.max_team_size ?? 5}
                required
              />
            </label>
            <TeamFields skills={skills.data ?? []} />
          </ActionForm>
        </details>
      )}
    </section>
  );
}
