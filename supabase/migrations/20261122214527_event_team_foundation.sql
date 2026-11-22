create table public.events (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
 university_id uuid references public.universities(id) on delete set null,
 title text not null check(char_length(title) between 3 and 160),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug)<=180),
 description text not null check(char_length(description) between 10 and 12000),
 category text not null check(category in ('hackathon','coding','ctf','ai','robotics','startup','workshop','conference','summer_school')),
 organizer text not null, starts_at timestamptz not null, ends_at timestamptz not null,
 registration_deadline timestamptz, location text, format text not null check(format in ('online','offline','hybrid')),
 registration_url text check(registration_url ~ '^https?://'), official_url text check(official_url ~ '^https?://'), source_url text not null check(source_url ~ '^https?://'), cover_path text,
 eligibility text, prizes text, min_team_size integer not null default 1, max_team_size integer not null default 5,
 source_status text not null default 'community' check(source_status in ('community','organizer_verified','admin_verified')),
 moderation_status text not null default 'pending' check(moderation_status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at>=starts_at), check(registration_deadline is null or registration_deadline<=starts_at), check(min_team_size between 1 and 100 and max_team_size between min_team_size and 100)
);
create index events_discovery on public.events(starts_at,id) where moderation_status='approved';
create index events_category on public.events(category,starts_at) where moderation_status='approved';
create index events_author on public.events(author_id);
create index events_university on public.events(university_id);
create table public.event_bookmarks (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 event_id uuid not null references public.events(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,event_id)
);
create index bookmarks_event on public.event_bookmarks(event_id);
create table public.teams (
 id uuid primary key default gen_random_uuid(),
 leader_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
 event_id uuid not null references public.events(id) on delete restrict,
 name text not null check(char_length(name) between 2 and 100),
 description text not null check(char_length(description) between 5 and 4000),
 max_size integer not null check(max_size between 1 and 100),
 recruitment_open boolean not null default true,
 visibility text not null default 'members' check(visibility in ('members','private')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(event_id,name)
);
create index teams_leader on public.teams(leader_id);
create table public.team_members (
 team_id uuid not null references public.teams(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete restrict,
 joined_at timestamptz not null default now(), primary key(team_id,user_id)
);
create index team_members_user on public.team_members(user_id);
create table public.team_applications (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 applicant_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 message text not null check(char_length(message) between 1 and 2000),
 status text not null default 'pending' check(status in ('pending','accepted','rejected','withdrawn')),
 created_at timestamptz not null default now(), decided_at timestamptz, unique(team_id,applicant_id)
);
create index team_applications_applicant on public.team_applications(applicant_id);
create function private.can_moderate() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.account_access a where a.user_id=(select auth.uid()) and a.status='verified' and a.role in ('moderator','admin','super_admin'))$$;
create function private.is_team_participant(t uuid) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and (exists(select 1 from public.teams where id=t and leader_id=auth.uid()) or exists(select 1 from public.team_members where team_id=t and user_id=auth.uid()))$$;
create function private.can_apply(t uuid) returns boolean language sql stable security definer set search_path='' as $$select private.is_verified() and not private.is_team_participant(t) and exists(select 1 from public.teams a join public.events e on e.id=a.event_id where a.id=t and a.recruitment_open and a.visibility='members' and e.moderation_status='approved')$$;
revoke all on function private.can_moderate(),private.is_team_participant(uuid),private.can_apply(uuid) from public,anon,authenticated;
grant execute on function private.can_moderate(),private.is_team_participant(uuid),private.can_apply(uuid) to authenticated;
alter table public.events enable row level security;
alter table public.event_bookmarks enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_applications enable row level security;
revoke all on public.events,public.event_bookmarks,public.teams,public.team_members,public.team_applications from public,anon,authenticated;
grant select(id,university_id,title,slug,description,category,organizer,starts_at,ends_at,registration_deadline,location,format,registration_url,official_url,source_url,cover_path,eligibility,prizes,min_team_size,max_team_size,source_status,moderation_status,created_at,updated_at) on public.events to anon,authenticated;
grant insert(university_id,title,slug,description,category,organizer,starts_at,ends_at,registration_deadline,location,format,registration_url,official_url,source_url,cover_path,eligibility,prizes,min_team_size,max_team_size) on public.events to authenticated;
create policy public_events on public.events for select to anon,authenticated using(moderation_status='approved');
create policy own_events on public.events for select to authenticated using(author_id=(select auth.uid()) or (select private.can_moderate()));
create policy event_submit on public.events for insert to authenticated with check(author_id=(select auth.uid()) and (select private.is_verified()) and moderation_status='pending' and source_status='community');
grant select,delete on public.event_bookmarks to authenticated;
grant insert(event_id) on public.event_bookmarks to authenticated;
create policy bookmark_read on public.event_bookmarks for select to authenticated using(user_id=(select auth.uid()) and (select private.is_verified()));
create policy bookmark_add on public.event_bookmarks for insert to authenticated with check(user_id=(select auth.uid()) and (select private.is_verified()) and exists(select 1 from public.events where id=event_id and moderation_status='approved'));
create policy bookmark_remove on public.event_bookmarks for delete to authenticated using(user_id=(select auth.uid()) and (select private.is_verified()));
grant select on public.teams,public.team_members,public.team_applications to authenticated;
grant insert(event_id,name,description,max_size,visibility) on public.teams to authenticated;
grant update(name,description,recruitment_open,visibility) on public.teams to authenticated;
create policy teams_read on public.teams for select to authenticated using((select private.is_verified()) and (private.is_team_participant(id) or (select private.can_moderate()) or (visibility='members' and exists(select 1 from public.events where id=event_id and moderation_status='approved'))));
create policy teams_create on public.teams for insert to authenticated with check(leader_id=(select auth.uid()) and (select private.is_verified()) and exists(select 1 from public.events e where e.id=event_id and e.moderation_status='approved' and max_size between e.min_team_size and e.max_team_size));
create policy teams_edit on public.teams for update to authenticated using(leader_id=(select auth.uid()) and (select private.is_verified())) with check(leader_id=(select auth.uid()) and (select private.is_verified()));
create policy members_read on public.team_members for select to authenticated using((select private.is_verified()) and (private.is_team_participant(team_id) or (select private.can_moderate())));
grant insert(team_id,message) on public.team_applications to authenticated;
create policy applications_read on public.team_applications for select to authenticated using((select private.is_verified()) and (applicant_id=(select auth.uid()) or (select private.can_moderate()) or exists(select 1 from public.teams t where t.id=team_id and t.leader_id=(select auth.uid()))));
create policy applications_create on public.team_applications for insert to authenticated with check(applicant_id=(select auth.uid()) and status='pending' and private.can_apply(team_id));
create trigger event_updated before update on public.events for each row execute function private.touch_updated_at();
create trigger team_updated before update on public.teams for each row execute function private.touch_updated_at();
create function private.review_application(application_id uuid, accept boolean) returns void language plpgsql security definer set search_path='' as $$
declare a public.team_applications%rowtype; t public.teams%rowtype;
begin
 if auth.uid() is null or not private.is_verified() or accept is null then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into a from public.team_applications where id=application_id;
 if not found then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into t from public.teams where id=a.team_id for update;
 if not found or t.leader_id<>auth.uid() then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into a from public.team_applications where id=application_id and team_id=t.id for update;
 if not found or a.status<>'pending' then raise exception 'Application not pending'; end if;
 if accept then
  if not t.recruitment_open or a.applicant_id=t.leader_id or not exists(select 1 from public.account_access where user_id=a.applicant_id and status='verified') then raise exception 'Applicant or team unavailable'; end if;
  if not exists(select 1 from public.events where id=t.event_id and moderation_status='approved') then raise exception 'Event unavailable'; end if;
  if 1+(select count(*) from public.team_members where team_id=t.id)>=t.max_size then raise exception 'Team full'; end if;
  insert into public.team_members(team_id,user_id) values(t.id,a.applicant_id);
 end if;
 update public.team_applications set status=case when accept then 'accepted' else 'rejected' end, decided_at=now() where id=a.id;
end $$;
revoke all on function private.review_application(uuid,boolean) from public,anon,authenticated;
grant execute on function private.review_application(uuid,boolean) to authenticated;
create function public.review_application(application_id uuid, accept boolean) returns void language sql security invoker set search_path='' as $$select private.review_application(application_id,accept)$$;
revoke all on function public.review_application(uuid,boolean) from public,anon,authenticated;
grant execute on function public.review_application(uuid,boolean) to authenticated;
