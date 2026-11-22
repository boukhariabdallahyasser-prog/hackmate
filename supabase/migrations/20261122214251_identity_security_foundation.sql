create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
create table public.universities (
 id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, city text, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.university_email_domains (
 id uuid primary key default gen_random_uuid(), university_id uuid not null references public.universities(id) on delete restrict, domain text not null unique check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+[.][a-z]{2,}$'), active boolean not null default true, created_at timestamptz not null default now()
);
create table public.account_access (
 user_id uuid primary key references auth.users(id) on delete cascade, role text not null default 'student' check (role in ('student','moderator','admin','super_admin')), status text not null default 'unverified' check (status in ('unverified','verified','suspended')), updated_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'), full_name text not null check (char_length(full_name) between 2 and 120), university_id uuid references public.universities(id) on delete restrict, academic_year text, field_of_study text, bio text check (char_length(bio)<=1000), avatar_path text, portfolio_url text, github_url text, linkedin_url text, availability text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.verification_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, university_id uuid not null references public.universities(id) on delete restrict, academic_year text not null, field_of_study text not null, evidence_path text not null, status text not null default 'pending' check (status in ('pending','approved','rejected','resubmission')), review_reason text, reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, created_at timestamptz not null default now()
);
create unique index verification_one_pending on public.verification_requests(user_id) where status='pending';
create index verification_queue on public.verification_requests(status,created_at);
create index profiles_university on public.profiles(university_id);
create index domain_university on public.university_email_domains(university_id);
create table public.admin_audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null, action text not null, target_id uuid, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create function private.is_verified() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.account_access a where a.user_id=(select auth.uid()) and a.status='verified') $$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.account_access a where a.user_id=(select auth.uid()) and a.status='verified' and a.role in ('admin','super_admin')) $$;
revoke all on function private.is_verified(), private.is_admin() from public, anon, authenticated;
grant execute on function private.is_verified(), private.is_admin() to authenticated;
alter table public.universities enable row level security;
alter table public.university_email_domains enable row level security;
alter table public.account_access enable row level security;
alter table public.profiles enable row level security;
alter table public.verification_requests enable row level security;
alter table public.admin_audit_logs enable row level security;
revoke all on public.universities,public.university_email_domains,public.account_access,public.profiles,public.verification_requests,public.admin_audit_logs from public,anon,authenticated;
grant select on public.universities,public.university_email_domains to anon,authenticated;
grant select on public.account_access,public.profiles,public.verification_requests,public.admin_audit_logs to authenticated;
grant insert(id,username,full_name,university_id,academic_year,field_of_study,bio,avatar_path,portfolio_url,github_url,linkedin_url,availability) on public.profiles to authenticated;
grant update(username,full_name,university_id,academic_year,field_of_study,bio,avatar_path,portfolio_url,github_url,linkedin_url,availability) on public.profiles to authenticated;
create policy universities_read on public.universities for select to anon,authenticated using (active);
create policy domains_read on public.university_email_domains for select to anon,authenticated using (active and exists(select 1 from public.universities u where u.id=university_id and u.active));
create policy account_owner_read on public.account_access for select to authenticated using (user_id=(select auth.uid()) or (select private.is_admin()));
create policy profiles_read on public.profiles for select to authenticated using (id=(select auth.uid()) or (select private.is_admin()) or ((select private.is_verified()) and exists(select 1 from public.account_access a where a.user_id=profiles.id and a.status='verified')));
-- Separate helper avoids account_access owner-only visibility hiding other verified profiles.
create function private.member_visible(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select auth.uid() is not null and private.is_verified() and exists(select 1 from public.account_access a where a.user_id=target and a.status='verified') $$;
revoke all on function private.member_visible(uuid) from public,anon,authenticated;
grant execute on function private.member_visible(uuid) to authenticated;
alter policy profiles_read on public.profiles using (id=(select auth.uid()) or (select private.is_admin()) or private.member_visible(id));
create policy profiles_insert on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy verification_read on public.verification_requests for select to authenticated using (user_id=(select auth.uid()) or (select private.is_admin()));
create policy audit_read on public.admin_audit_logs for select to authenticated using ((select private.is_admin()));
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
revoke all on function private.touch_updated_at() from public,anon,authenticated;
create trigger profile_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger account_updated before update on public.account_access for each row execute function private.touch_updated_at();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('verification-evidence','verification-evidence',false,5242880,array['application/pdf','image/jpeg','image/png']);
