import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const member = "00000000-0000-4000-8000-000000000001";
const staff = "00000000-0000-4000-8000-000000000002";
const teammate = "00000000-0000-4000-8000-000000000003";
const spare = "00000000-0000-4000-8000-000000000004";
const campus = "00000000-0000-4000-8000-000000000010";
const evidence = `${member}/00000000-0000-4000-8000-000000000099.pdf`;
const db = new PGlite();

async function as(
  role: "anon" | "authenticated",
  id: string,
  statement: string,
  values: unknown[] = [],
) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [
      id,
    ]);
    return tx.query(statement, values);
  });
}

beforeAll(async () => {
  // Minimal Supabase Auth and Storage interfaces for exercising real PostgreSQL policies.
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create schema storage;
    create table auth.users(id uuid primary key, email text not null, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth, storage to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit integer,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
    alter table storage.objects enable row level security;
    grant select, insert, delete on storage.objects to authenticated;
  `);
  const directory = new URL("../../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    await db.exec(await readFile(new URL(file, directory), "utf8"));
  }
  await db.query(
    "insert into public.universities(id,name,slug) values ($1,'Test University','test-university')",
    [campus],
  );
  await db.query(
    "insert into public.university_email_domains(university_id,domain) values($1,'campus.test')",
    [campus],
  );
  for (const [id, name] of [
    [member, "Student One"],
    [staff, "Staff Member"],
    [teammate, "Student Two"],
    [spare, "Student Three"],
  ]) {
    await db.query("insert into auth.users values($1,$2,now())", [
      id,
      `${name.toLowerCase().replaceAll(" ", "-")}@campus.test`,
    ]);
    const username = name.toLowerCase().replaceAll(" ", "_");
    await as(
      "authenticated",
      id,
      "insert into public.profiles(id,username,full_name) values($1,$2,$3)",
      [id, username, name],
    );
  }
  await db.query(
    "update public.account_access set status='verified' where user_id = any($1::uuid[])",
    [[staff, teammate, spare]],
  );
  await db.query(
    "update public.account_access set role='admin' where user_id=$1",
    [staff],
  );
});

afterAll(async () => {
  await db.close();
});

describe("HackMate database access and workflows", () => {
  test("limits sign-ups to configured domains and protects member fields", async () => {
    await expect(
      db.query(
        "insert into auth.users values(gen_random_uuid(),'visitor@example.test',now())",
      ),
    ).rejects.toThrow("university email");
    await expect(
      as("anon", "", "select id from public.profiles"),
    ).rejects.toThrow("permission denied");
    const visible = await as(
      "authenticated",
      member,
      "select id from public.profiles",
    );
    expect(visible.rows).toEqual([{ id: member }]);
    await expect(
      as(
        "authenticated",
        member,
        "update public.profiles set university_id=$1 where id=$2",
        [campus, member],
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      as(
        "authenticated",
        member,
        "update public.account_access set status='verified'",
      ),
    ).rejects.toThrow("permission denied");
  });

  test("reviews private verification evidence and records a notification", async () => {
    await as(
      "authenticated",
      member,
      "insert into storage.objects(bucket_id,name) values('verification-evidence',$1)",
      [evidence],
    );
    expect(
      (await as("authenticated", teammate, "select name from storage.objects"))
        .rows,
    ).toHaveLength(0);
    await as(
      "authenticated",
      member,
      "select public.submit_verification('Year 2','Computing',$1)",
      [evidence],
    );
    const requests = await db.query<{ id: string }>(
      "select id from public.verification_requests where user_id=$1",
      [member],
    );
    const request = requests.rows[0].id;
    await expect(
      as(
        "authenticated",
        teammate,
        "select public.review_verification($1,true,'Matches student ID')",
        [request],
      ),
    ).rejects.toThrow("not authorized");
    expect(
      (await as("authenticated", staff, "select name from storage.objects"))
        .rows,
    ).toEqual([{ name: evidence }]);
    expect(
      (
        await as(
          "authenticated",
          member,
          "delete from storage.objects where name=$1 returning name",
          [evidence],
        )
      ).rows,
    ).toHaveLength(0);
    await as(
      "authenticated",
      staff,
      "select public.review_verification($1,true,'Matches student ID')",
      [request],
    );
    expect(
      (
        await as(
          "authenticated",
          member,
          "select status from public.account_access",
        )
      ).rows,
    ).toEqual([{ status: "verified" }]);
    expect(
      (
        await as(
          "authenticated",
          member,
          "select message from public.notifications",
        )
      ).rows,
    ).toEqual([{ message: "Student verification approved." }]);
    expect(
      (
        await as(
          "authenticated",
          teammate,
          "select message from public.notifications",
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await as(
          "authenticated",
          staff,
          "select action from public.admin_audit_logs",
        )
      ).rows,
    ).toEqual([{ action: "verification.review" }]);
  });

  test("saves taxonomy, moderates an event, and accepts membership only up to capacity", async () => {
    await as(
      "authenticated",
      staff,
      "select public.staff_catalog('skill','TypeScript',null,true)",
    );
    await as(
      "authenticated",
      staff,
      "select public.staff_catalog('interest','Open source',null,true)",
    );
    const skill = (
      await db.query<{ id: string }>("select id from public.skills")
    ).rows[0].id;
    const interest = (
      await db.query<{ id: string }>(
        "select id from public.interests where name = 'Open source'",
      )
    ).rows[0].id;
    await as(
      "authenticated",
      member,
      "select public.save_profile_taxonomy($1::jsonb,$2::uuid[])",
      [{ [skill]: 4 }, [interest]],
    );
    expect(
      (
        await as(
          "authenticated",
          teammate,
          "select proficiency from public.profile_skills where profile_id=$1",
          [member],
        )
      ).rows,
    ).toEqual([{ proficiency: 4 }]);
    await as(
      "authenticated",
      member,
      "update public.profiles set discoverable=false where id=$1",
      [member],
    );
    expect(
      (
        await as(
          "authenticated",
          teammate,
          "select proficiency from public.profile_skills where profile_id=$1",
          [member],
        )
      ).rows,
    ).toEqual([]);

    const details = {
      title: "Fixture hackathon",
      slug: "fixture-test",
      description: "A real test description",
      category: "hackathon",
      organizer: "University",
      starts_at: "2027-01-01T09:00:00Z",
      ends_at: "2027-01-01T16:00:00Z",
      format: "offline",
      source_url: "https://example.com/event",
      min_team_size: 1,
      max_team_size: 2,
    };
    await as("authenticated", member, "select public.submit_event($1,$2)", [
      details,
      [skill],
    ]);
    expect((await as("anon", "", "select id from public.events")).rows).toEqual(
      [],
    );
    expect(
      (await as("anon", "", "select skill_id from public.event_skills")).rows,
    ).toEqual([]);
    const event = (
      await db.query<{ id: string }>("select id from public.events")
    ).rows[0].id;
    await expect(
      as(
        "authenticated",
        teammate,
        "select public.review_event($1,true,'Confirmed details')",
        [event],
      ),
    ).rejects.toThrow("Not authorized");
    await as(
      "authenticated",
      staff,
      "select public.review_event($1,true,'Confirmed details')",
      [event],
    );
    expect((await as("anon", "", "select id from public.events")).rows).toEqual(
      [{ id: event }],
    );
    expect(
      (await as("anon", "", "select skill_id from public.event_skills")).rows,
    ).toEqual([{ skill_id: skill }]);
    await as(
      "authenticated",
      spare,
      "insert into public.event_bookmarks(event_id) values($1)",
      [event],
    );
    const created = await as(
      "authenticated",
      member,
      "select public.save_team(null,$1,'Team Alpha','Build our app',2,'Frontend',true,false,$2) as id",
      [event, [skill]],
    );
    const { id: team } = created.rows[0] as { id: string };
    await as("authenticated", member, "select public.invite_member($1,$2)", [
      team,
      teammate,
    ]);
    await as(
      "authenticated",
      spare,
      "insert into public.team_applications(team_id,message) values ($1,'I can help with testing')",
      [team],
    );
    const invite = (
      await db.query<{ id: string }>("select id from public.team_invitations")
    ).rows[0].id;
    const request = (
      await db.query<{ id: string }>("select id from public.team_applications")
    ).rows[0].id;
    await expect(
      as("authenticated", spare, "select public.respond_invitation($1,true)", [
        invite,
      ]),
    ).rejects.toThrow("unavailable");
    await as(
      "authenticated",
      teammate,
      "select public.respond_invitation($1,true)",
      [invite],
    );
    await expect(
      as("authenticated", member, "select public.review_application($1,true)", [
        request,
      ]),
    ).rejects.toThrow("Team full");
    await as(
      "authenticated",
      member,
      "select public.manage_member($1,$2,true)",
      [team, teammate],
    );
    expect(
      (await db.query("select leader_id from public.teams where id=$1", [team]))
        .rows,
    ).toEqual([{ leader_id: teammate }]);
    expect(
      (
        await db.query(
          "select user_id from public.team_members where team_id=$1",
          [team],
        )
      ).rows,
    ).toEqual([{ user_id: member }]);
    await as(
      "authenticated",
      teammate,
      "select public.review_application($1,false)",
      [request],
    );
    await as(
      "authenticated",
      spare,
      "insert into public.reports(event_id,reason) values($1,'The registration details need review')",
      [event],
    );
    const report = (
      await db.query<{ id: string }>("select id from public.reports")
    ).rows[0].id;
    await as(
      "authenticated",
      staff,
      "select public.close_report($1,'Checked the organizer source')",
      [report],
    );
    expect((await db.query("select status from public.reports")).rows).toEqual([
      { status: "closed" },
    ]);
  });
  test("invited students can see private teams and moderation prevents reopening", async () => {
    const event = (
      await db.query<{ id: string }>("select id from public.events")
    ).rows[0].id;
    const result = await as(
      "authenticated",
      member,
      "select public.save_team(null,$1,'Private Team','A private project',2,'',false,true,$2) as id",
      [event, []],
    );
    const { id: team } = result.rows[0] as { id: string };
    expect(
      (
        await as(
          "authenticated",
          teammate,
          "select id from public.teams where id=$1",
          [team],
        )
      ).rows,
    ).toEqual([]);
    await as("authenticated", member, "select public.invite_member($1,$2)", [
      team,
      teammate,
    ]);
    expect(
      (
        await as(
          "authenticated",
          teammate,
          "select id from public.teams where id=$1",
          [team],
        )
      ).rows,
    ).toEqual([{ id: team }]);
    await as(
      "authenticated",
      staff,
      "select public.restrict_team($1,'Organizer review')",
      [team],
    );
    expect(
      (
        await as(
          "authenticated",
          teammate,
          "select id from public.teams where id=$1",
          [team],
        )
      ).rows,
    ).toEqual([]);
    await expect(
      as(
        "authenticated",
        member,
        "update public.teams set recruitment_open=true where id=$1",
        [team],
      ),
    ).rejects.toThrow("restricted_team_recruitment");
    await as(
      "authenticated",
      staff,
      "select public.unpublish_event($1,'Organizer cancelled the event')",
      [event],
    );
    expect(
      (
        await as("anon", "", "select id from public.events where id=$1", [
          event,
        ])
      ).rows,
    ).toEqual([]);
    expect(
      (
        await as(
          "authenticated",
          spare,
          "select message from public.notifications where destination='/account/submissions'",
        )
      ).rows,
    ).toEqual([
      { message: "A published event you saved or submitted was removed." },
    ]);
  });
  test("confirmed email queues approval once, protects the queue, and unlocks onboarding after review", async () => {
    const applicant = "00000000-0000-4000-8000-000000000055";
    await db.query(
      "insert into auth.users values ($1,'fresh@campus.test',null)",
      [applicant],
    );
    const query =
      "select status from public.student_approvals where user_id=$1";
    expect(
      (await as("authenticated", applicant, query, [applicant])).rows,
    ).toEqual([]);
    await db.query(
      "update auth.users set email_confirmed_at=now() where id=$1",
      [applicant],
    );
    await db.query(
      "update auth.users set email_confirmed_at=now() where id=$1",
      [applicant],
    );
    expect(
      (await as("authenticated", applicant, query, [applicant])).rows,
    ).toEqual([{ status: "pending" }]);
    expect(
      (await as("authenticated", teammate, query, [applicant])).rows,
    ).toEqual([]);
    const notices = await as(
      "authenticated",
      staff,
      "select id from public.notifications where message like 'A student confirmed%'",
    );
    expect(notices.rows).toHaveLength(1);
    await expect(
      as(
        "authenticated",
        applicant,
        "select public.review_student($1,true,'Valid enrollment')",
        [applicant],
      ),
    ).rejects.toThrow("not authorized");
    const selected = (
      await db.query<{ id: string }>(
        "select id from public.interests where name='Cybersecurity'",
      )
    ).rows[0].id;
    const onboarding =
      "select public.complete_student_onboarding('Fresh Student','fresh_student','Cybersecurity',$1)";
    await expect(
      as("authenticated", applicant, onboarding, [[selected]]),
    ).rejects.toThrow("Not authorized");
    await as(
      "authenticated",
      staff,
      "select public.review_student($1,true,'Confirmed institutional email')",
      [applicant],
    );
    expect(
      (await as("authenticated", applicant, query, [applicant])).rows,
    ).toEqual([{ status: "approved" }]);
    await as("authenticated", applicant, onboarding, [[selected]]);
    expect(
      (
        await as(
          "authenticated",
          applicant,
          "select onboarded_at is not null as onboarded from public.account_access",
        )
      ).rows,
    ).toEqual([{ onboarded: true }]);
    expect(
      (
        await as(
          "authenticated",
          applicant,
          "select field_of_study from public.profiles where id=$1",
          [applicant],
        )
      ).rows,
    ).toEqual([{ field_of_study: "Cybersecurity" }]);
    await expect(
      as("authenticated", applicant, onboarding, [[selected]]),
    ).rejects.toThrow("Onboarding is unavailable");
  });
  test("ENSIA setup can be rerun without overriding existing settings", async () => {
    const seed = await readFile(
      new URL("../../supabase/bootstrap/ensia.sql", import.meta.url),
      "utf8",
    );
    await db.exec(seed);
    await db.exec(seed);
    const domains = await db.query(
      "select domain from public.university_email_domains where domain = 'ensia.edu.dz'",
    );
    expect(domains.rows).toEqual([{ domain: "ensia.edu.dz" }]);
    await db.exec(
      "update public.university_email_domains set active=false where domain='ensia.edu.dz'",
    );
    await expect(db.exec(seed)).rejects.toThrow("Review the existing ENSIA");
    await db.exec("rollback");
    const result = await db.query(
      "select active from public.university_email_domains where domain='ensia.edu.dz'",
    );
    expect(result.rows).toEqual([{ active: false }]);
  });
});
