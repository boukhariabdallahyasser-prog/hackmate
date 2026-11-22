import Link from "next/link";
import { notFound } from "next/navigation";
import { review } from "@/app/staff/actions";
import { reportItem } from "@/app/account/event/actions";
import { ActionForm } from "@/components/action-form";
import { requireMember } from "@/lib/supabase/server";
import { uuid } from "@/lib/forms";
import { applyToTeam, saveTeam, updateTeam } from "../actions";
import { TeamFields } from "../team-fields";

export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { client, id, access } = await requireMember("verified");
  const { team: key } = await params;
  if (!uuid.safeParse(key).success) notFound();
  const { data: team, error } = await client
    .from("teams")
    .select("*")
    .eq("id", key)
    .maybeSingle();
  if (error)
    return (
      <section className="shell section">
        <h1>Team unavailable</h1>
        <Link href="/teams">Back to teams</Link>
      </section>
    );
  if (!team) notFound();
  const leads = team.leader_id === id;
  const [roster, applications, taxonomy, teamSkills, foundMembers, outgoing] =
    await Promise.all([
      client
        .from("team_members")
        .select("user_id")
        .eq("team_id", key)
        .limit(100),
      client
        .from("team_applications")
        .select("id,applicant_id,message,status")
        .eq("team_id", key)
        .limit(100),
      client.from("skills").select("id,name").order("name"),
      client.from("team_skills").select("skill_id").eq("team_id", key),
      leads
        ? client
            .from("profiles")
            .select("id,full_name")
            .eq("discoverable", true)
            .neq("id", id)
            .order("full_name")
            .limit(200)
        : null,
      leads
        ? client
            .from("team_invitations")
            .select("id,recipient_id,status")
            .eq("team_id", key)
            .order("created_at", { ascending: false })
            .limit(50)
        : null,
    ]);
  if (
    [roster, applications, taxonomy, teamSkills, foundMembers, outgoing].some(
      (result) => result?.error,
    )
  ) {
    return (
      <section className="shell section">
        <h1>{team.name}</h1>
        <p role="alert">Team information is temporarily unavailable.</p>
      </section>
    );
  }
  const memberIds = roster.data?.map((member) => member.user_id) ?? [];
  const visibleIds = [
    ...new Set([
      team.leader_id,
      ...memberIds,
      ...(applications.data ?? []).map((item) => item.applicant_id),
    ]),
  ];
  const profiles = await client
    .from("profiles")
    .select("id,full_name")
    .in("id", visibleIds);
  const names = new Map(
    profiles.data?.map((profile) => [profile.id, profile.full_name]),
  );
  const participant = leads || memberIds.includes(id);
  const selectedSkills = teamSkills.data?.map((skill) => skill.skill_id) ?? [];
  const myApplication = applications.data?.find(
    (item) => item.applicant_id === id,
  );
  return (
    <section className="shell section form-page">
      <Link className="underlined" href="/teams">
        All teams
      </Link>
      <h1>{team.name}</h1>
      <p>{team.description}</p>
      <p>Team leader · {names.get(team.leader_id) ?? "Verified student"}</p>
      <p>Team capacity · {team.max_size}</p>
      {team.staff_restricted && (
        <p className="notice">Staff have closed recruitment for this team.</p>
      )}
      {team.open_positions && <p>Open positions · {team.open_positions}</p>}
      {selectedSkills.length > 0 && (
        <p>
          Required skills ·{" "}
          {taxonomy.data
            ?.filter((skill) => selectedSkills.includes(skill.id))
            .map((skill) => skill.name)
            .join(", ")}
        </p>
      )}
      {myApplication && (
        <p className="notice">Your application is {myApplication.status}.</p>
      )}
      {!participant &&
        !myApplication &&
        team.recruitment_open &&
        team.visibility === "members" && (
          <ActionForm
            action={applyToTeam.bind(null, key)}
            submit="Request to join"
          >
            <label>
              Message
              <textarea name="message" maxLength={2000} required />
            </label>
          </ActionForm>
        )}
      {participant && (
        <div className="card-list">
          <h2>Members</h2>
          {memberIds.length === 0 ? (
            <p>The leader is the only member so far.</p>
          ) : (
            <ul>
              {memberIds.map((member) => (
                <li className="notice" key={member}>
                  {names.get(member) ?? "Team member"}
                  {(leads || member === id) && (
                    <ActionForm
                      action={updateTeam.bind(null, "membership", key)}
                      submit="Update membership"
                    >
                      <input type="hidden" name="member" value={member} />
                      <label>
                        Action
                        <select name="decision">
                          <option value="remove">
                            {leads ? "Remove member" : "Leave team"}
                          </option>
                          {leads && (
                            <option value="transfer">
                              Transfer leadership
                            </option>
                          )}
                        </select>
                      </label>
                    </ActionForm>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {leads && (
        <>
          {!team.staff_restricted && (
            <details className="notice">
              <summary>Edit team</summary>
              <ActionForm action={saveTeam.bind(null, key)} submit="Save team">
                <TeamFields
                  team={team}
                  skills={taxonomy.data ?? []}
                  selected={selectedSkills}
                />
              </ActionForm>
            </details>
          )}
          <div className="card-list">
            <h2>Applications</h2>
            {applications.data?.length ? (
              applications.data.map((item) => (
                <article className="notice" key={item.id}>
                  <strong>
                    {names.get(item.applicant_id) ?? "Student applicant"}
                  </strong>
                  <p>{item.message}</p>
                  <p className="meta">{item.status}</p>
                  {item.status === "pending" && (
                    <ActionForm
                      action={updateTeam.bind(null, "application", item.id)}
                      submit="Decide application"
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
              ))
            ) : (
              <p>No join requests yet.</p>
            )}
          </div>
          <details className="notice">
            <summary>Team invitations</summary>
            {!team.staff_restricted && !!foundMembers?.data?.length && (
              <ActionForm
                action={updateTeam.bind(null, "invite", key)}
                submit="Send invitation"
              >
                <label>
                  Teammate
                  <select name="recipient" required defaultValue="">
                    <option value="" disabled>
                      Choose a verified student
                    </option>
                    {foundMembers.data
                      .filter((profile) => !memberIds.includes(profile.id))
                      .map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </option>
                      ))}
                  </select>
                </label>
              </ActionForm>
            )}
            {outgoing?.data?.length ? (
              <ul>
                {outgoing.data.map((invite) => (
                  <li key={invite.id}>
                    {foundMembers?.data?.find(
                      (member) => member.id === invite.recipient_id,
                    )?.full_name ?? "Student"}{" "}
                    · {invite.status}
                    {invite.status === "pending" && (
                      <ActionForm
                        action={updateTeam.bind(
                          null,
                          "cancel-invitation",
                          invite.id,
                        )}
                        submit="Cancel invitation"
                      />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No invitations sent yet.</p>
            )}
          </details>
        </>
      )}
      <details className="notice">
        <summary>Report team</summary>
        <ActionForm
          action={reportItem.bind(null, "team", key)}
          submit="Send report"
        >
          <label>
            Reason
            <textarea name="reason" minLength={10} maxLength={1000} required />
          </label>
        </ActionForm>
      </details>
      {access?.role !== "student" && !team.staff_restricted && (
        <details className="notice">
          <summary>Moderate recruitment</summary>
          <ActionForm
            action={review.bind(null, "team", key)}
            submit="Restrict team"
          >
            <label>
              Reason
              <textarea name="reason" minLength={3} maxLength={1000} required />
            </label>
          </ActionForm>
        </details>
      )}
    </section>
  );
}
