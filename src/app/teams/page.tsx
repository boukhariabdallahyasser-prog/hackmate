import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Mail,
  Plus,
  UsersRound,
} from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
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
  const pendingInvites = invited.data?.filter((invite) => invite.status === "pending") ?? [];

  return (
    <section className="shell section teams-page">
      <div className="teams-intro">
        <div>
          <p className="section-overline">BETTER TOGETHER</p>
          <h1>{current ? `Teams for ${current.title}` : "Find your next team."}</h1>
          <p>Discover teams working toward an event, find an open spot, or start something of your own.</p>
        </div>
        <div className="teams-actions">
          <Link href="/community" className="teams-people-link">
            <UsersRound size={17} aria-hidden="true" /> Find teammates
          </Link>
          {!!events.data?.length && (
            <a href="#create-team" className="teams-create-link">
              <Plus size={17} aria-hidden="true" /> Create a team
            </a>
          )}
        </div>
      </div>
      {selectedInvite.success && (
        <div className="notice team-invite-panel">
          <div className="teams-section-heading">
            <div><p className="section-overline">INVITATION</p><h2>Invite a teammate</h2></div>
            <Mail size={25} aria-hidden="true" />
          </div>
          {!nominee?.data?.discoverable ? (
            <p>This student is unavailable.</p>
          ) : !owned.data?.length ? (
            <p>Create a team before sending an invitation.</p>
          ) : (
            <>
              <p>Choose a team to invite {nominee.data.full_name}.</p>
              <div className="team-invite-list">
                {owned.data.map((team) => (
                  <ActionForm
                    key={team.id}
                    action={updateTeam.bind(null, "invite", team.id)}
                    submit={`Invite to ${team.name}`}
                  >
                    <input type="hidden" name="recipient" value={nominee.data?.id} />
                  </ActionForm>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {!!pendingInvites.length && (
        <div className="notice team-invitations-panel">
          <h2><Mail size={21} aria-hidden="true" /> Invitations waiting for you</h2>
          <p className="meta">A team has invited you. Review the invitation below.</p>
          {pendingInvites.map((invite) => (
            <div className="team-invitation-row" key={invite.id}>
              <Link href={`/teams/${invite.team_id}`} className="underlined">
                {teamNames.get(invite.team_id) ?? "View invited team"}
              </Link>
              <ActionForm
                action={updateTeam.bind(null, "invitation", invite.id)}
                submit="Respond"
              >
                <label>
                  Your decision
                  <select name="decision">
                    <option value="accept">Accept invitation</option>
                    <option value="reject">Decline invitation</option>
                  </select>
                </label>
              </ActionForm>
            </div>
          ))}
        </div>
      )}
      <div className="teams-section-heading">
        <div>
          <p className="section-overline">COMMUNITY TEAMS</p>
          <h2>Explore teams</h2>
          <p>{visibleTeams.length} team{visibleTeams.length === 1 ? "" : "s"} in this view</p>
        </div>
        {!!params.event && <Link href="/teams" className="underlined">View all teams <ArrowRight size={15} aria-hidden="true" /></Link>}
      </div>
      {!!events.data?.length && (
        <form action="/teams" className="team-filter-form">
          <label>
            <Compass size={17} aria-hidden="true" /> Filter by event
            <select name="event" defaultValue={current?.id ?? ""}>
              <option value="">All approved events</option>
              {events.data.map((event) => (
                <option value={event.id} key={event.id}>{event.title}</option>
              ))}
            </select>
          </label>
          <Button type="submit">Filter teams <ArrowRight size={16} aria-hidden="true" /></Button>
        </form>
      )}
      {visibleTeams.length ? (
        <div className="event-grid">
          {visibleTeams.map((team) => {
            const recruiting = team.recruitment_open && team.visibility === "members";
            return (
              <Link href={`/teams/${team.id}`} className="event-card team-card" key={team.id}>
                <div className="event-card-top">
                  <span className={recruiting ? "team-status recruiting" : "team-status"}>
                    {recruiting ? "Open to join" : "Invite only or closed"}
                  </span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </div>
                <span className="team-card-symbol"><UsersRound size={24} aria-hidden="true" /></span>
                <strong className="team-card-title">{team.name}</strong>
                <p className="meta">
                  {eventNames.get(team.event_id) ?? "Event team"}
                  {team.leader_id === id && " · You lead this team"}
                </p>
                <p className="team-card-description">{team.open_positions || team.description}</p>
                <span className="team-card-footer">View team <ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <UsersRound size={28} aria-hidden="true" />
          <h3>No teams in this view</h3>
          <p>Be the first to start a team for an event, or explore other events.</p>
          <Link className="empty-action" href="/events">Explore events <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      )}
      {!!applications.data?.length && (
        <div className="teams-requests">
          <h2>My join requests</h2>
          <div className="card-list">
            {applications.data.map((application) => (
              <p className="notice" key={application.id}>
                {teamNames.get(application.team_id) ?? "Team"} · {application.status}
              </p>
            ))}
          </div>
        </div>
      )}
      {!!events.data?.length && (
        <section id="create-team" className="notice team-create-panel">
          <div>
            <p className="section-overline">TAKE THE LEAD</p>
            <h2>Start a team</h2>
            <p>Pick an event, describe your idea, and let other students know how they can help.</p>
          </div>
          <ActionForm action={saveTeam.bind(null, null)} submit="Create team">
            <label>
              Event
              <select name="event" required defaultValue={current?.id ?? ""}>
                <option value="" disabled>Choose an event</option>
                {events.data.map((event) => (
                  <option value={event.id} key={event.id}>
                    {event.title} ({event.min_team_size}–{event.max_team_size} members)
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
        </section>
      )}
    </section>
  );
}
