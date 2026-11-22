-- Extend the deployed foundation without rewriting migration history.
create function private.email_university(address text) returns uuid
language sql stable security definer set search_path = '' as $$
  select d.university_id from public.university_email_domains d
  join public.universities u on u.id = d.university_id
  where d.domain = lower(split_part(address, '@', 2)) and d.active and u.active
$$;

create function private.enforce_university_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.email is not distinct from old.email then return new; end if;
  if private.email_university(new.email) is null then
    raise exception 'A supported university email is required' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' then
    update public.account_access set status = 'unverified'
      where user_id = new.id and status = 'verified';
    update public.verification_requests set status = 'resubmission'
      where user_id = new.id and status = 'pending';
  end if;
  return new;
end $$;
create trigger hackmate_university_email before insert or update of email on auth.users
for each row execute function private.enforce_university_email();

create function private.create_account_access() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_access(user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger hackmate_create_account after insert on auth.users
for each row execute function private.create_account_access();
insert into public.account_access(user_id) select id from auth.users on conflict do nothing;

-- Verified affiliation is written during review and protected by column grants.
revoke insert(university_id), update(university_id) on public.profiles from authenticated;
alter table public.profiles
  add column discoverable boolean not null default true,
  add column experience text check (char_length(experience) <= 2000),
  add column preferred_roles text[] not null default '{}' check (cardinality(preferred_roles) <= 8);
grant insert(discoverable,experience,preferred_roles), update(discoverable,experience,preferred_roles)
  on public.profiles to authenticated;
alter policy profiles_read on public.profiles using (
  id = (select auth.uid()) or (select private.is_admin())
  or (discoverable and private.member_visible(id))
);

create table public.skills (
  id uuid primary key default gen_random_uuid(), name text not null unique
  check (char_length(btrim(name)) between 2 and 80), created_at timestamptz not null default now()
);
create table public.interests (
  id uuid primary key default gen_random_uuid(), name text not null unique
  check (char_length(btrim(name)) between 2 and 80), created_at timestamptz not null default now()
);
create table public.profile_skills (
  profile_id uuid references public.profiles(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete restrict,
  proficiency smallint not null check (proficiency between 1 and 5),
  primary key(profile_id, skill_id)
);
create table public.profile_interests (
  profile_id uuid references public.profiles(id) on delete cascade,
  interest_id uuid references public.interests(id) on delete restrict,
  primary key(profile_id, interest_id)
);
create table public.event_skills (
  event_id uuid references public.events(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete restrict,
  primary key(event_id, skill_id)
);
create table public.team_skills (
  team_id uuid references public.teams(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete restrict,
  primary key(team_id, skill_id)
);
alter table public.teams add column open_positions text not null default ''
  check (char_length(open_positions) <= 1500),
  add column staff_restricted boolean not null default false,
  add constraint restricted_team_recruitment check (not staff_restricted or (not recruitment_open and visibility = 'private'));
grant insert(open_positions), update(open_positions) on public.teams to authenticated;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  destination text not null check (destination in ('/account','/account/submissions','/account/notifications','/teams')),
  created_at timestamptz not null default now(), read_at timestamptz
);
create index notifications_recipient on public.notifications(user_id, created_at desc);
create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index invitations_recipient on public.team_invitations(recipient_id, status);
create unique index invitation_one_pending on public.team_invitations(team_id,recipient_id) where status = 'pending';

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 10 and 1000),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now(), resolved_at timestamptz,
  check (num_nonnulls(event_id,team_id) = 1)
);
create index reports_queue on public.reports(status, created_at);
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  event_id uuid references public.events(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  decision text not null, reason text not null, created_at timestamptz not null default now(),
  check (num_nonnulls(event_id,report_id) = 1)
);
create table public.platform_settings (
  key text primary key check (key = 'announcement'),
  value text not null check (char_length(value) <= 500),
  updated_at timestamptz not null default now()
);

alter table public.skills enable row level security;
alter table public.interests enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_interests enable row level security;
alter table public.event_skills enable row level security;
alter table public.team_skills enable row level security;
alter table public.notifications enable row level security;
alter table public.team_invitations enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.platform_settings enable row level security;

revoke all on public.skills, public.interests, public.profile_skills, public.profile_interests,
  public.event_skills, public.team_skills, public.notifications, public.team_invitations,
  public.reports, public.moderation_actions, public.platform_settings from public, anon, authenticated;
grant select on public.skills, public.event_skills, public.platform_settings to anon, authenticated;
grant select on public.interests, public.profile_skills, public.profile_interests,
  public.team_skills, public.notifications, public.team_invitations, public.reports,
  public.moderation_actions to authenticated;
grant insert(reporter_id,event_id,team_id,reason) on public.reports to authenticated;

create policy skills_read on public.skills for select to anon, authenticated using (true);
create policy interests_read on public.interests for select to authenticated using ((select private.is_verified()));
create policy profile_skills_read on public.profile_skills for select to authenticated using (
  exists(select 1 from public.profiles p where p.id = profile_id)
);
create policy profile_interests_read on public.profile_interests for select to authenticated using (
  exists(select 1 from public.profiles p where p.id = profile_id)
);
create policy event_skills_read on public.event_skills for select to anon, authenticated using (
  exists(select 1 from public.events e where e.id = event_id)
);
create policy team_skills_read on public.team_skills for select to authenticated using (
  exists(select 1 from public.teams t where t.id = team_id)
);
create policy notification_owner on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy invitation_read on public.team_invitations for select to authenticated using (
  (select private.is_verified()) and
  (recipient_id = (select auth.uid()) or (select private.can_moderate())
  or exists(select 1 from public.teams t where t.id = team_id and t.leader_id = (select auth.uid())))
);
create policy report_read on public.reports for select to authenticated using (
  reporter_id = (select auth.uid()) or (select private.can_moderate())
);
create policy report_create on public.reports for insert to authenticated with check (
  reporter_id = (select auth.uid()) and status = 'open' and (select private.is_verified())
  and (exists(select 1 from public.events e where e.id = event_id and e.moderation_status = 'approved')
    or exists(select 1 from public.teams t where t.id = team_id))
);
create policy moderation_read on public.moderation_actions for select to authenticated using ((select private.can_moderate()));
create policy settings_read on public.platform_settings for select to anon, authenticated using (true);
create policy universities_admin_read on public.universities for select to authenticated using ((select private.is_admin()));
-- Inactive domain rows remain restricted to administrators.
create policy domains_admin_read on public.university_email_domains for select to authenticated using ((select private.is_admin()));
grant select(author_id) on public.events to authenticated;
-- Authors are represented by the account UUID only. Email addresses stay in Auth.

create policy verification_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'verification-evidence'
  and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}[.](pdf|jpg|png)$')
);
create policy verification_download on storage.objects for select to authenticated using (
  bucket_id = 'verification-evidence' and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or ((select private.is_admin()) and exists(
      select 1 from public.verification_requests v where v.evidence_path = storage.objects.name
    ))
  )
);
create policy verification_upload_cleanup on storage.objects for delete to authenticated using (
  bucket_id = 'verification-evidence' and split_part(name, '/', 1) = (select auth.uid())::text
  and not exists(select 1 from public.verification_requests v where v.evidence_path = storage.objects.name)
);

create function private.submit_verification(academic_year text, field_of_study text, evidence text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  member uuid := auth.uid();
  university uuid;
  member_status text;
begin
  select a.status into member_status from public.account_access a where a.user_id = member for update;
  if member is null or member_status is distinct from 'unverified' then
    raise exception 'Verification is not available' using errcode = '42501';
  end if;
  select private.email_university(u.email) into university from auth.users u
    where u.id = member and u.email_confirmed_at is not null;
  if university is null or not exists(select 1 from public.profiles where id = member) then
    raise exception 'Confirm your university email and complete your profile';
  end if;
  if academic_year is null or char_length(btrim(academic_year)) not between 1 and 40
    or field_of_study is null or char_length(btrim(field_of_study)) not between 2 and 100
    or evidence is null or split_part(evidence, '/', 1) <> member::text
    or not exists(select 1 from storage.objects where bucket_id = 'verification-evidence' and name = evidence)
  then raise exception 'Invalid verification submission' using errcode = '23514'; end if;
  if exists(select 1 from public.verification_requests v where v.evidence_path = evidence) then
    raise exception 'Upload new evidence for this request';
  end if;
  insert into public.verification_requests(user_id,university_id,academic_year,field_of_study,evidence_path)
    values(member,university,btrim(academic_year),btrim(field_of_study),evidence);
end $$;

create function private.review_verification(request_id uuid, approved boolean, reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  request public.verification_requests%rowtype;
  member_status text;
begin
  if not private.is_admin() or approved is null or reason is null
    or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception 'Review is not authorized or is incomplete' using errcode = '42501';
  end if;
  select * into request from public.verification_requests where id = request_id;
  if not found or request.user_id = auth.uid() then raise exception 'Request unavailable'; end if;
  select a.status into member_status from public.account_access a where a.user_id = request.user_id for update;
  select * into request from public.verification_requests where id = request_id for update;
  if not found or request.status <> 'pending' or member_status is distinct from 'unverified' then
    raise exception 'Request is no longer pending';
  end if;
  if approved then
    if not exists(select 1 from auth.users u where u.id = request.user_id and u.email_confirmed_at is not null
      and private.email_university(u.email) = request.university_id) then raise exception 'University email changed'; end if;
    update public.account_access set status = 'verified' where user_id = request.user_id;
    update public.profiles set university_id = request.university_id,
      academic_year = request.academic_year, field_of_study = request.field_of_study where id = request.user_id;
  end if;
  update public.verification_requests set status = case when approved then 'approved' else 'rejected' end,
    review_reason = btrim(reason), reviewed_by = auth.uid(), reviewed_at = now() where id = request.id;
  insert into public.notifications(user_id,message,destination) values(request.user_id,
    case when approved then 'Student verification approved.' else 'Student verification declined. See your account for details.' end, '/account');
  insert into public.admin_audit_logs(actor_id,action,target_id,details) values(auth.uid(),
    'verification.review',request.id,jsonb_build_object('approved',approved));
end $$;

create function private.save_profile_taxonomy(skill_levels jsonb, interests uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_verified() or skill_levels is null or jsonb_typeof(skill_levels) <> 'object'
    or (select count(*) from jsonb_object_keys(skill_levels)) > 30
    or interests is null or cardinality(interests) > 30 then
    raise exception 'Invalid profile taxonomy' using errcode = '42501';
  end if;
  perform 1 from public.profiles where id = auth.uid() for update;
  delete from public.profile_skills where profile_id = auth.uid();
  insert into public.profile_skills(profile_id,skill_id,proficiency)
    select auth.uid(), key::uuid, value::smallint from jsonb_each_text(skill_levels);
  delete from public.profile_interests where profile_id = auth.uid();
  insert into public.profile_interests(profile_id,interest_id)
    select distinct auth.uid(), interest from unnest(interests) as interest;
end $$;

create function private.submit_event(details jsonb, skills uuid[])
returns text language plpgsql security definer set search_path = '' as $$
declare
  draft public.events%rowtype;
  created_id uuid;
begin
  if not private.is_verified() or skills is null or cardinality(skills) > 30 then raise exception 'Not authorized' using errcode='42501'; end if;
  draft := jsonb_populate_record(null::public.events, details);
  insert into public.events(university_id,title,slug,description,category,organizer,starts_at,ends_at,format,location,
    source_url,registration_url,official_url,cover_path,registration_deadline,min_team_size,max_team_size,eligibility,prizes)
  values((select university_id from public.profiles where id = auth.uid()),draft.title,draft.slug,draft.description,draft.category,draft.organizer,draft.starts_at,draft.ends_at,
    draft.format,draft.location,draft.source_url,draft.registration_url,draft.official_url,draft.cover_path,
    draft.registration_deadline,draft.min_team_size,draft.max_team_size,draft.eligibility,draft.prizes)
  returning id into created_id;
  insert into public.event_skills(event_id,skill_id) select distinct created_id, skill from unnest(skills) as skill;
  return draft.slug;
end $$;

create function private.review_event(event_id uuid, approved boolean, reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  submitter uuid;
begin
  if not private.can_moderate() or approved is null or reason is null or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception 'Not authorized or incomplete decision' using errcode = '42501';
  end if;
  update public.events e set moderation_status = case when approved then 'approved' else 'rejected' end
    where e.id = event_id and e.moderation_status = 'pending' returning e.author_id into submitter;
  if not found then raise exception 'Event no longer pending'; end if;
  insert into public.moderation_actions(actor_id,event_id,decision,reason) values(auth.uid(),event_id,
    case when approved then 'approved' else 'rejected' end,btrim(reason));
  insert into public.admin_audit_logs(actor_id,action,target_id,details) values(auth.uid(),'event.review',event_id,
    jsonb_build_object('approved',approved));
  insert into public.notifications(user_id,message,destination) values(submitter,
    case when approved then 'Your event was published.' else 'Your event submission was declined.' end,'/account/submissions');
end $$;

create function private.save_team(team uuid, event uuid, title text, description text, capacity integer,
  positions text, recruiting boolean, private_team boolean, skills uuid[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  target uuid := team;
begin
  if not private.is_verified() or skills is null or cardinality(skills) > 30 then raise exception 'Not authorized' using errcode='42501'; end if;
  if target is null then
    if not exists(select 1 from public.events e where e.id = event and e.moderation_status = 'approved'
      and capacity between e.min_team_size and e.max_team_size) then raise exception 'Invalid event or capacity'; end if;
    insert into public.teams(event_id,name,description,max_size,open_positions,recruitment_open,visibility)
      values(event,title,description,capacity,positions,recruiting,case when private_team then 'private' else 'members' end)
      returning id into target;
  else
    update public.teams t set name = title, description = save_team.description, open_positions = positions,
      recruitment_open = recruiting, visibility = case when private_team then 'private' else 'members' end
      where t.id = target and t.leader_id = auth.uid();
    if not found then raise exception 'Not authorized' using errcode='42501'; end if;
    delete from public.team_skills t where t.team_id = target;
  end if;
  insert into public.team_skills(team_id,skill_id) select distinct target, skill from unnest(skills) as skill;
  return target;
end $$;

create function private.invite_member(team uuid, recipient uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.teams%rowtype;
begin
  select * into target from public.teams where id = team for update;
  if not found or not private.is_verified() or target.leader_id <> auth.uid() or target.staff_restricted
    or recipient = auth.uid() or not private.member_visible(recipient)
    or not exists(select 1 from public.profiles p where p.id = recipient and p.discoverable)
    or exists(select 1 from public.team_members m where m.team_id = team and m.user_id = recipient)
    then raise exception 'Invitation is not available' using errcode='42501'; end if;
  insert into public.team_invitations(team_id,recipient_id,invited_by)
    values(team,recipient,auth.uid()) on conflict (team_id,recipient_id) where status = 'pending' do nothing;
  if found then
    insert into public.notifications(user_id,message,destination) values(recipient,'You received a team invitation.','/teams');
  end if;
end $$;

create function private.respond_invitation(invitation uuid, accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  invite public.team_invitations%rowtype;
  target public.teams%rowtype;
begin
  select * into invite from public.team_invitations where id = invitation;
  if not found or not private.is_verified() or invite.recipient_id <> auth.uid() or accept is null then
    raise exception 'Invitation unavailable' using errcode='42501';
  end if;
  select * into target from public.teams where id = invite.team_id for update;
  if not found then raise exception 'Team unavailable'; end if;
  select * into invite from public.team_invitations where id = invitation for update;
  if not found or invite.status <> 'pending' then raise exception 'Invitation no longer pending'; end if;
  if accept then
    if not exists(select 1 from public.events where id = target.event_id and moderation_status = 'approved') then
      raise exception 'Event unavailable';
    end if;
    if target.leader_id = auth.uid() or exists(select 1 from public.team_members where team_id = target.id and user_id = auth.uid()) then
      raise exception 'Already a member';
    end if;
    if 1 + (select count(*) from public.team_members where team_id = target.id) >= target.max_size then
      raise exception 'Team full';
    end if;
    insert into public.team_members(team_id,user_id) values(target.id,auth.uid());
    update public.team_applications set status = 'withdrawn', decided_at = now()
      where team_id = target.id and applicant_id = auth.uid() and status = 'pending';
  end if;
  update public.team_invitations set status = case when accept then 'accepted' else 'declined' end, decided_at = now()
    where id = invite.id;
  insert into public.notifications(user_id,message,destination) values(target.leader_id,
    case when accept then 'A team invitation was accepted.' else 'A team invitation was declined.' end, '/teams');
end $$;

create function private.manage_member(team uuid, member uuid, transfer boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.teams%rowtype;
begin
  select * into target from public.teams where id = team for update;
  if not found or not private.is_verified() or transfer is null or
    (target.leader_id <> auth.uid() and (transfer or member <> auth.uid())) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  if transfer and not private.member_visible(member) then raise exception 'New leader must be verified'; end if;
  delete from public.team_members where team_id = team and user_id = member;
  if not found then raise exception 'Team member unavailable'; end if;
  if transfer then
    update public.teams set leader_id = member where id = team;
    insert into public.team_members(team_id,user_id) values(team,target.leader_id);
  end if;
  insert into public.notifications(user_id,message,destination) values(member,
    case when transfer then 'You now lead a team.' else 'Your team membership ended.' end, '/teams');
end $$;

create function private.application_notification() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recipient uuid;
begin
  if tg_op = 'INSERT' then
    select leader_id into recipient from public.teams where id = new.team_id;
    insert into public.notifications(user_id,message,destination) values(recipient,'A student requested to join your team.','/teams');
  elsif new.status in ('accepted','rejected') and new.status is distinct from old.status then
    insert into public.notifications(user_id,message,destination) values(new.applicant_id,
      case when new.status = 'accepted' then 'Your team application was accepted.' else 'Your team application was declined.' end,'/teams');
    if new.status = 'accepted' then
      update public.team_invitations set status = 'cancelled', decided_at = now()
        where team_id = new.team_id and recipient_id = new.applicant_id and status = 'pending';
    end if;
  end if;
  return new;
end $$;
create trigger application_notice after insert or update of status on public.team_applications
for each row execute function private.application_notification();

create function private.read_notifications() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;

create function private.close_report(report uuid, reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_moderate() or reason is null or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception 'Not authorized or incomplete decision' using errcode='42501';
  end if;
  update public.reports set status='closed', resolved_at=now() where id=report and status='open';
  if not found then raise exception 'Report unavailable'; end if;
  insert into public.moderation_actions(actor_id,report_id,decision,reason)
    values(auth.uid(),report,'closed',btrim(reason));
  insert into public.admin_audit_logs(actor_id,action,target_id) values(auth.uid(),'report.close',report);
end $$;

create function private.staff_catalog(kind text, name text, parent uuid, active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
  input_name text := btrim(name);
begin
  if not private.is_admin() or input_name is null or char_length(input_name) not between 2 and 200 or active is null then
    raise exception 'Not authorized or invalid catalog value' using errcode='42501';
  end if;
  case kind
    when 'university' then
      insert into public.universities(name,slug,active)
      values(input_name,trim(both '-' from regexp_replace(lower(input_name),'[^a-z0-9]+','-','g')) || '-' || left(gen_random_uuid()::text, 8),active)
      on conflict on constraint universities_name_key do update set active = excluded.active returning id into target;
    when 'domain' then
      insert into public.university_email_domains(domain,university_id,active) values(lower(input_name),parent,active)
      on conflict(domain) do update set university_id = excluded.university_id, active = excluded.active returning id into target;
    when 'skill' then
      insert into public.skills(name) values(input_name) on conflict on constraint skills_name_key do nothing returning id into target;
    when 'interest' then
      insert into public.interests(name) values(input_name) on conflict on constraint interests_name_key do nothing returning id into target;
    else raise exception 'Invalid catalog';
  end case;
  insert into public.admin_audit_logs(actor_id,action,target_id,details) values(auth.uid(),'catalog.' || kind,target,
    jsonb_build_object('name',input_name,'active',active));
end $$;

create function private.staff_account(member uuid, status text, role text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target public.account_access%rowtype;
  root boolean;
begin
  if not private.is_admin() or member = auth.uid() then raise exception 'Not authorized' using errcode='42501'; end if;
  select a.role = 'super_admin' into root from public.account_access a where a.user_id = auth.uid();
  select * into target from public.account_access where user_id = member for update;
  if not found or target.role = 'super_admin' or (target.role <> 'student' and not root) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  if status is not null and status not in ('suspended','unverified') then raise exception 'Invalid status'; end if;
  if role is not null and (not root or role not in ('student','moderator','admin')
    or target.status <> 'verified' or status is not null) then raise exception 'Invalid role change' using errcode='42501'; end if;
  update public.account_access a set status = coalesce(staff_account.status, a.status), role = coalesce(staff_account.role,a.role)
    where user_id = member;
  if status is not null then
    update public.verification_requests set status = 'resubmission' where user_id = member and verification_requests.status = 'pending';
  end if;
  insert into public.admin_audit_logs(actor_id,action,target_id,details) values(auth.uid(),'account.update',member,
    jsonb_build_object('status',status,'role',role));
end $$;

create function private.save_announcement(message text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() or message is null or char_length(message) > 500 then
    raise exception 'Not authorized or invalid announcement' using errcode='42501';
  end if;
  insert into public.platform_settings(key,value) values('announcement',btrim(message))
    on conflict(key) do update set value = excluded.value, updated_at = now();
  insert into public.admin_audit_logs(actor_id,action) values(auth.uid(),'settings.announcement');
end $$;

-- Revoke defaults from all private helpers before allowing explicitly listed RPCs.
revoke all on function private.email_university(text), private.enforce_university_email(),
  private.create_account_access(), private.application_notification() from public, anon, authenticated;

create function public.submit_verification(academic_year text, field_of_study text, evidence text) returns void
language sql security invoker set search_path = '' as $$ select private.submit_verification(academic_year, field_of_study, evidence) $$;
revoke all on function public.submit_verification(text, text, text), private.submit_verification(text, text, text) from public, anon, authenticated;
grant execute on function public.submit_verification(text, text, text), private.submit_verification(text, text, text) to authenticated;

create function public.review_verification(request_id uuid, approved boolean, reason text) returns void
language sql security invoker set search_path = '' as $$ select private.review_verification(request_id, approved, reason) $$;
revoke all on function public.review_verification(uuid, boolean, text), private.review_verification(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.review_verification(uuid, boolean, text), private.review_verification(uuid, boolean, text) to authenticated;

create function public.save_profile_taxonomy(skill_levels jsonb, interests uuid[]) returns void
language sql security invoker set search_path = '' as $$ select private.save_profile_taxonomy(skill_levels, interests) $$;
revoke all on function public.save_profile_taxonomy(jsonb, uuid[]), private.save_profile_taxonomy(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.save_profile_taxonomy(jsonb, uuid[]), private.save_profile_taxonomy(jsonb, uuid[]) to authenticated;

create function public.submit_event(details jsonb, skills uuid[]) returns text
language sql security invoker set search_path = '' as $$ select private.submit_event(details, skills) $$;
revoke all on function public.submit_event(jsonb, uuid[]), private.submit_event(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.submit_event(jsonb, uuid[]), private.submit_event(jsonb, uuid[]) to authenticated;

create function public.review_event(event_id uuid, approved boolean, reason text) returns void
language sql security invoker set search_path = '' as $$ select private.review_event(event_id, approved, reason) $$;
revoke all on function public.review_event(uuid, boolean, text), private.review_event(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.review_event(uuid, boolean, text), private.review_event(uuid, boolean, text) to authenticated;

create function public.save_team(team uuid, event uuid, title text, description text, capacity integer, positions text, recruiting boolean, private_team boolean, skills uuid[]) returns uuid
language sql security invoker set search_path = '' as $$ select private.save_team(team, event, title, description, capacity, positions, recruiting, private_team, skills) $$;
revoke all on function public.save_team(uuid, uuid, text, text, integer, text, boolean, boolean, uuid[]), private.save_team(uuid, uuid, text, text, integer, text, boolean, boolean, uuid[]) from public, anon, authenticated;
grant execute on function public.save_team(uuid, uuid, text, text, integer, text, boolean, boolean, uuid[]), private.save_team(uuid, uuid, text, text, integer, text, boolean, boolean, uuid[]) to authenticated;

create function public.invite_member(team uuid, recipient uuid) returns void
language sql security invoker set search_path = '' as $$ select private.invite_member(team, recipient) $$;
revoke all on function public.invite_member(uuid, uuid), private.invite_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.invite_member(uuid, uuid), private.invite_member(uuid, uuid) to authenticated;

create function public.respond_invitation(invitation uuid, accept boolean) returns void
language sql security invoker set search_path = '' as $$ select private.respond_invitation(invitation, accept) $$;
revoke all on function public.respond_invitation(uuid, boolean), private.respond_invitation(uuid, boolean) from public, anon, authenticated;
grant execute on function public.respond_invitation(uuid, boolean), private.respond_invitation(uuid, boolean) to authenticated;

create function public.manage_member(team uuid, member uuid, transfer boolean) returns void
language sql security invoker set search_path = '' as $$ select private.manage_member(team, member, transfer) $$;
revoke all on function public.manage_member(uuid, uuid, boolean), private.manage_member(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.manage_member(uuid, uuid, boolean), private.manage_member(uuid, uuid, boolean) to authenticated;

create function public.read_notifications() returns void
language sql security invoker set search_path = '' as $$ select private.read_notifications() $$;
revoke all on function public.read_notifications(), private.read_notifications() from public, anon, authenticated;
grant execute on function public.read_notifications(), private.read_notifications() to authenticated;

create function public.close_report(report uuid, reason text) returns void
language sql security invoker set search_path = '' as $$ select private.close_report(report, reason) $$;
revoke all on function public.close_report(uuid, text), private.close_report(uuid, text) from public, anon, authenticated;
grant execute on function public.close_report(uuid, text), private.close_report(uuid, text) to authenticated;

create function public.staff_catalog(kind text, name text, parent uuid, active boolean) returns void
language sql security invoker set search_path = '' as $$ select private.staff_catalog(kind, name, parent, active) $$;
revoke all on function public.staff_catalog(text, text, uuid, boolean), private.staff_catalog(text, text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.staff_catalog(text, text, uuid, boolean), private.staff_catalog(text, text, uuid, boolean) to authenticated;

create function public.staff_account(member uuid, status text, role text) returns void
language sql security invoker set search_path = '' as $$ select private.staff_account(member, status, role) $$;
revoke all on function public.staff_account(uuid, text, text), private.staff_account(uuid, text, text) from public, anon, authenticated;
grant execute on function public.staff_account(uuid, text, text), private.staff_account(uuid, text, text) to authenticated;

create function public.save_announcement(message text) returns void
language sql security invoker set search_path = '' as $$ select private.save_announcement(message) $$;
revoke all on function public.save_announcement(text), private.save_announcement(text) from public, anon, authenticated;
grant execute on function public.save_announcement(text), private.save_announcement(text) to authenticated;

create function private.has_team_invitation(team uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.team_invitations t
    where t.team_id = team and t.recipient_id = auth.uid() and t.status = 'pending')
$$;
revoke all on function private.has_team_invitation(uuid) from public, anon, authenticated;
grant execute on function private.has_team_invitation(uuid) to authenticated;
create policy teams_by_invitation on public.teams for select to authenticated using (
  (select private.is_verified()) and private.has_team_invitation(id)
);

create table public.profile_event_interests (
  profile_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(profile_id,event_id)
);
create index profile_event_interest_event on public.profile_event_interests(event_id,profile_id);
alter table public.profile_event_interests enable row level security;
revoke all on public.profile_event_interests from public,anon,authenticated;
grant select, delete on public.profile_event_interests to authenticated;
grant insert(event_id) on public.profile_event_interests to authenticated;
create policy event_interests_read on public.profile_event_interests for select to authenticated using (
  (select private.is_verified()) and exists(select 1 from public.profiles where id = profile_id)
);
create policy event_interests_insert on public.profile_event_interests for insert to authenticated with check (
  profile_id = (select auth.uid()) and (select private.is_verified())
  and exists(select 1 from public.events where id = event_id and moderation_status = 'approved')
);
create policy event_interests_delete on public.profile_event_interests for delete to authenticated using (
  profile_id = (select auth.uid()) and (select private.is_verified())
);

create function private.cancel_invitation(invitation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target public.team_invitations%rowtype;
  leader uuid;
begin
  select * into target from public.team_invitations where id = invitation;
  if not found or not private.is_verified() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select leader_id into leader from public.teams where id = target.team_id for update;
  if not found or (leader <> auth.uid() and not private.can_moderate()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.team_invitations set status = 'cancelled', decided_at = now()
    where id = invitation and status = 'pending';
  if not found then raise exception 'Invitation unavailable'; end if;
  insert into public.notifications(user_id,message,destination)
    values(target.recipient_id,'A team invitation was cancelled.','/teams');
  if leader <> auth.uid() then
    insert into public.admin_audit_logs(actor_id,action,target_id)
      values(auth.uid(),'invitation.cancel',invitation);
  end if;
end $$;

create function private.restrict_team(team uuid, reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare leader uuid;
begin
  if not private.can_moderate() or reason is null or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.teams set recruitment_open = false, visibility = 'private', staff_restricted = true
    where id = team returning leader_id into leader;
  if not found then raise exception 'Team unavailable'; end if;
  update public.team_invitations set status = 'cancelled', decided_at = now()
    where team_id = team and status = 'pending';
  insert into public.notifications(user_id,message,destination)
    values(leader,'Staff restricted recruitment for one of your teams.','/teams');
  insert into public.admin_audit_logs(actor_id,action,target_id,details)
    values(auth.uid(),'team.restrict',team,jsonb_build_object('reason',btrim(reason)));
end $$;

create function private.unpublish_event(event uuid, reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare submitter uuid;
begin
  if not private.can_moderate() or reason is null or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.events set moderation_status = 'rejected'
    where id = event and moderation_status = 'approved' returning author_id into submitter;
  if not found then raise exception 'Event is no longer published'; end if;
  insert into public.notifications(user_id,message,destination)
    select member,'A published event you saved or submitted was removed.','/account/submissions'
    from (select submitter as member union select user_id from public.event_bookmarks where event_id = event) recipients;
  insert into public.moderation_actions(actor_id,event_id,decision,reason)
    values(auth.uid(),event,'unpublished',btrim(reason));
  insert into public.admin_audit_logs(actor_id,action,target_id)
    values(auth.uid(),'event.unpublish',event);
end $$;

create function public.cancel_invitation(invitation uuid) returns void
language sql security invoker set search_path = '' as $$ select private.cancel_invitation(invitation) $$;
create function public.restrict_team(team uuid, reason text) returns void
language sql security invoker set search_path = '' as $$ select private.restrict_team(team,reason) $$;
create function public.unpublish_event(event uuid, reason text) returns void
language sql security invoker set search_path = '' as $$ select private.unpublish_event(event,reason) $$;
revoke all on function private.cancel_invitation(uuid), private.restrict_team(uuid,text), private.unpublish_event(uuid,text),
  public.cancel_invitation(uuid), public.restrict_team(uuid,text), public.unpublish_event(uuid,text) from public, anon, authenticated;
grant execute on function private.cancel_invitation(uuid), private.restrict_team(uuid,text), private.unpublish_event(uuid,text),
  public.cancel_invitation(uuid), public.restrict_team(uuid,text), public.unpublish_event(uuid,text) to authenticated;
