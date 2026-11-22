import Link from "next/link";
import { updateTeam } from "@/app/teams/actions";
import { ActionForm } from "@/components/action-form";
import { httpsUrl } from "@/lib/forms";
import { requireMember } from "@/lib/supabase/server";
import {
  manageAccount,
  manageCatalog,
  review,
  saveAnnouncement,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Moderation", robots: { index: false } };

function DecisionFields({ report = false }: { report?: boolean }) {
  return (
    <>
      {!report && (
        <label>
          Decision
          <select name="decision">
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </label>
      )}
      <label>
        Reason
        <textarea name="reason" minLength={3} maxLength={1000} required />
      </label>
    </>
  );
}

export default async function StaffPage() {
  const { client, id, access } = await requireMember("moderator");
  const admin = access?.role === "admin" || access?.role === "super_admin";
  const root = access?.role === "super_admin";
  const eventQuery = client
    .from("events")
    .select("id,title,description,source_url,organizer", { count: "exact" })
    .eq("moderation_status", "pending")
    .order("created_at")
    .limit(30);
  const [
    eventQueue,
    reportQueue,
    teams,
    invites,
    verifications,
    universities,
    domains,
    accounts,
    audit,
    settings,
  ] = await Promise.all([
    eventQuery,
    client
      .from("reports")
      .select("id,event_id,team_id,reason", { count: "exact" })
      .eq("status", "open")
      .order("created_at")
      .limit(30),
    client
      .from("teams")
      .select("id,name,visibility", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(30),
    client
      .from("team_invitations")
      .select("id,team_id,status", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      ? client
          .from("verification_requests")
          .select("id,user_id,academic_year,field_of_study,university_id", {
            count: "exact",
          })
          .eq("status", "pending")
          .order("created_at")
          .limit(30)
      : null,
    admin
      ? client.from("universities").select("id,name,active").order("name")
      : null,
    admin
      ? client
          .from("university_email_domains")
          .select("domain,active,university_id")
          .order("domain")
      : null,
    admin
      ? client
          .from("account_access")
          .select("user_id,role,status", { count: "exact" })
          .order("updated_at", { ascending: false })
          .limit(50)
      : null,
    admin
      ? client
          .from("admin_audit_logs")
          .select("id,action,created_at")
          .order("created_at", { ascending: false })
          .limit(50)
      : null,
    admin
      ? client
          .from("platform_settings")
          .select("value")
          .eq("key", "announcement")
          .maybeSingle()
      : null,
  ]);
  const unavailable = [
    eventQueue,
    reportQueue,
    teams,
    invites,
    verifications,
    universities,
    domains,
    accounts,
    audit,
    settings,
  ].some((result) => result?.error);
  const ids = [
    ...new Set([
      ...(accounts?.data?.map((account) => account.user_id) ?? []),
      ...(verifications?.data?.map((entry) => entry.user_id) ?? []),
    ]),
  ];
  const profiles = ids.length
    ? await client.from("profiles").select("id,full_name").in("id", ids)
    : null;
  const names = new Map(
    profiles?.data?.map((profile) => [profile.id, profile.full_name]),
  );
  const universityNames = new Map(
    universities?.data?.map((item) => [item.id, item.name]),
  );

  return (
    <section className="shell section member-content">
      <h1>Moderation dashboard</h1>
      {admin && (
        <Link href="/staff/students" className="staff-review-link">
          <strong>Student account approvals</strong>
          <span>Review students who confirmed their university emails →</span>
        </Link>
      )}

      {unavailable && (
        <p className="notice" role="alert">
          Some staff data is temporarily unavailable.
        </p>
      )}
      <dl className="event-grid">
        {[
          ["Pending events", eventQueue.count],
          ["Open reports", reportQueue.count],
          ["Teams", teams.count],
          ["Invitations", invites.count],
          ...(admin
            ? [
                ["Student accounts", accounts?.count],
                ["Verification requests", verifications?.count],
              ]
            : []),
        ].map(([label, value]) => (
          <div className="notice" key={label}>
            <dt>{label}</dt>
            <dd>{value ?? "Unavailable"}</dd>
          </div>
        ))}
      </dl>
      {admin && (
        <div className="card-list">
          <h2>Verification queue</h2>
          {verifications?.data?.length ? (
            verifications.data.map((item) => (
              <article className="notice form-page" key={item.id}>
                <strong>
                  {names.get(item.user_id) ?? "Student applicant"}
                </strong>
                <p>
                  {universityNames.get(item.university_id)} ·{" "}
                  {item.field_of_study} · {item.academic_year}
                </p>
                <a className="underlined" href={`/staff/evidence/${item.id}`}>
                  Download evidence
                </a>
                <ActionForm
                  action={review.bind(null, "verification", item.id)}
                  submit="Record verification decision"
                >
                  <DecisionFields />
                </ActionForm>
              </article>
            ))
          ) : (
            <p>No pending requests.</p>
          )}
        </div>
      )}
      <div className="card-list">
        <h2>Event moderation</h2>
        {eventQueue.data?.length ? (
          eventQueue.data.map((item) => (
            <article className="notice form-page" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.organizer}</p>
              <p>{item.description}</p>
              {httpsUrl(item.source_url) && (
                <a
                  className="underlined"
                  href={httpsUrl(item.source_url)!}
                  rel="noreferrer"
                >
                  Review source
                </a>
              )}
              {admin && (
                <ActionForm
                  action={review.bind(null, "event", item.id)}
                  submit="Record event decision"
                >
                  <DecisionFields />
                </ActionForm>
              )}
            </article>
          ))
        ) : (
          <p>No pending events.</p>
        )}
      </div>
      <div className="card-list">
        <h2>Reports</h2>
        {reportQueue.data?.length ? (
          reportQueue.data.map((item) => (
            <article className="notice form-page" key={item.id}>
              <p>{item.reason}</p>
              {item.team_id && (
                <Link className="underlined" href={`/teams/${item.team_id}`}>
                  View team
                </Link>
              )}
              {item.event_id && (
                <Link
                  className="underlined"
                  href={`/staff/events/${item.event_id}`}
                >
                  View reported event
                </Link>
              )}
              <ActionForm
                action={review.bind(null, "report", item.id)}
                submit="Close report"
              >
                <DecisionFields report />
              </ActionForm>
            </article>
          ))
        ) : (
          <p>No open reports.</p>
        )}
      </div>
      <details className="notice">
        <summary>Teams and invitations</summary>
        <ul className="card-list">
          {teams.data?.map((team) => (
            <li key={team.id}>
              <Link className="underlined" href={`/teams/${team.id}`}>
                {team.name}
              </Link>{" "}
              · {team.visibility}
            </li>
          ))}
        </ul>
        <ul className="card-list">
          {invites.data?.map((invite) => (
            <li key={invite.id}>
              <Link className="underlined" href={`/teams/${invite.team_id}`}>
                View team
              </Link>{" "}
              · Invitation {invite.status}
              {invite.status === "pending" && (
                <ActionForm
                  action={updateTeam.bind(null, "cancel-invitation", invite.id)}
                  submit="Cancel invitation"
                />
              )}
            </li>
          ))}
        </ul>
      </details>
      {admin && (
        <>
          <details className="notice form-page">
            <summary>Universities, domains, skills and interests</summary>
            <ActionForm action={manageCatalog} submit="Save catalog item">
              <label>
                Catalog
                <select name="kind">
                  <option value="university">University</option>
                  <option value="domain">Email domain</option>
                  <option value="skill">Skill</option>
                  <option value="interest">Interest</option>
                </select>
              </label>
              <label>
                Name or email domain
                <input name="name" maxLength={200} required />
              </label>
              <label>
                University for email domain
                <select name="university">
                  <option value="">Choose university</option>
                  {universities?.data?.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                University or domain status
                <select name="active">
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            </ActionForm>
            <ul className="card-list">
              {domains?.data?.map((item) => (
                <li key={item.domain}>
                  {item.domain} · {universityNames.get(item.university_id)} ·{" "}
                  {item.active ? "active" : "disabled"}
                </li>
              ))}
            </ul>
          </details>
          <details className="notice">
            <summary>Student and staff accounts</summary>
            <ul className="card-list">
              {accounts?.data?.map((account) => (
                <li key={account.user_id} className="notice form-page">
                  <strong>
                    {names.get(account.user_id) ?? account.user_id}
                  </strong>
                  <p>
                    {account.role} · {account.status}
                  </p>
                  {account.user_id !== id &&
                    account.role !== "super_admin" &&
                    (account.role === "student" || root) && (
                      <ActionForm
                        action={manageAccount.bind(null, account.user_id)}
                        submit="Update account"
                      >
                        <label>
                          Action
                          <select name="decision">
                            <option value="suspended">Suspend</option>
                            <option value="unverified">
                              Require verification
                            </option>
                            {root && account.status === "verified" && (
                              <>
                                <option value="student">
                                  Set role to student
                                </option>
                                <option value="moderator">
                                  Set role to moderator
                                </option>
                                <option value="admin">Set role to admin</option>
                              </>
                            )}
                          </select>
                        </label>
                      </ActionForm>
                    )}
                </li>
              ))}
            </ul>
          </details>
          <details className="notice form-page">
            <summary>Platform announcement</summary>
            <ActionForm action={saveAnnouncement} submit="Save announcement">
              <label>
                Announcement for signed-in users
                <textarea
                  name="message"
                  defaultValue={settings?.data?.value}
                  maxLength={500}
                />
              </label>
            </ActionForm>
          </details>
          <details className="notice">
            <summary>Recent audit actions</summary>
            <ul className="card-list">
              {audit?.data?.map((log) => (
                <li key={log.id}>
                  {log.action} ·{" "}
                  <time dateTime={log.created_at}>
                    {log.created_at.slice(0, 10)}
                  </time>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
