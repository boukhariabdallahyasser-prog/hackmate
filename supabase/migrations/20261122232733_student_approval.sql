create table public.student_approvals (
  user_id uuid primary key references public.account_access(user_id) on delete cascade,
  university_id uuid not null references public.universities(id),
  university_email text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_reason text
);
create index student_approvals_queue on public.student_approvals(status, requested_at);
alter table public.student_approvals enable row level security;
revoke all on public.student_approvals from public, anon, authenticated;
grant select on public.student_approvals to authenticated;
create policy student_approval_read on public.student_approvals for select to authenticated using (
  user_id = (select auth.uid()) or (select private.is_admin())
);

alter table public.account_access add column onboarded_at timestamptz;
update public.account_access a set onboarded_at = now()
where a.status = 'verified' and exists(select 1 from public.profiles p where p.id=a.user_id);

alter table public.notifications drop constraint notifications_destination_check;
alter table public.notifications add constraint notifications_destination_check
  check (destination in ('/account','/account/submissions','/account/notifications','/teams','/staff/students'));

create function private.queue_student_approval(member uuid, address text) returns void
language plpgsql security definer set search_path = '' as $$
declare campus uuid := private.email_university(address);
begin
  if campus is null or not exists (
    select 1 from public.account_access where user_id=member and status='unverified'
  ) then return; end if;
  insert into public.student_approvals(user_id,university_id,university_email)
    values(member,campus,lower(address))
    on conflict(user_id) do update set university_id=excluded.university_id,
      university_email=excluded.university_email,status='pending',requested_at=now(),
      reviewed_at=null,reviewed_by=null,review_reason=null
    where public.student_approvals.university_email is distinct from excluded.university_email;
  if found then
    insert into public.notifications(user_id,message,destination)
      select user_id,'A student confirmed their university email and is awaiting approval.','/staff/students'
      from public.account_access where status='verified' and role in ('admin','super_admin');
  end if;
end $$;

create function private.on_student_email_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is null then return new; end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null and old.email is not distinct from new.email then
    return new;
  end if;
  perform private.queue_student_approval(new.id,new.email);
  return new;
end $$;
-- The name sorts after hackmate_create_account for already-confirmed inserts.
create trigger hackmate_queue_student after insert or update of email_confirmed_at,email on auth.users
  for each row execute function private.on_student_email_confirmed();

select private.queue_student_approval(id,email) from auth.users where email_confirmed_at is not null;

create function private.review_student(member uuid, approved boolean, reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  request public.student_approvals%rowtype;
  member_status text;
begin
  if not private.is_admin() or member is null or member=auth.uid() or approved is null
    or reason is null or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception 'Review is not authorized' using errcode='42501';
  end if;
  select a.status into member_status from public.account_access a where a.user_id=member for update;
  select * into request from public.student_approvals where user_id=member for update;
  if not found or request.status <> 'pending' or member_status is distinct from 'unverified' then
    raise exception 'Request is no longer pending';
  end if;
  if not exists(select 1 from auth.users u where u.id=member and u.email_confirmed_at is not null
    and lower(u.email)=request.university_email and private.email_university(u.email)=request.university_id) then
    raise exception 'Confirmed university email changed';
  end if;
  if approved then
    update public.account_access set status='verified',onboarded_at=null where user_id=member;
    update public.profiles set university_id=request.university_id where id=member;
  end if;
  update public.student_approvals set status=case when approved then 'approved' else 'rejected' end,
    reviewed_at=now(),reviewed_by=auth.uid(),review_reason=btrim(reason) where user_id=member;
  insert into public.notifications(user_id,message,destination) values(member,
    case when approved then 'Your student account was approved.' else 'Your student account request was declined.' end,'/account');
  insert into public.admin_audit_logs(actor_id,action,target_id,details)
    values(auth.uid(),'student.review',member,jsonb_build_object('approved',approved));
end $$;

create function private.complete_student_onboarding(name text, handle text, field text, selected_interests uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare
  member uuid := auth.uid();
  campus uuid;
begin
  if not private.is_verified() then raise exception 'Not authorized' using errcode='42501'; end if;
  if name is null or char_length(btrim(name)) not between 2 and 120
    or handle is null or handle !~ '^[a-z0-9_]{3,30}$'
    or field is null or char_length(btrim(field)) not between 2 and 100
    or selected_interests is null or cardinality(selected_interests) not between 1 and 8 then
    raise exception 'Invalid onboarding data' using errcode='23514';
  end if;
  perform 1 from public.account_access where user_id=member and status='verified' and onboarded_at is null for update;
  if not found then raise exception 'Onboarding is unavailable'; end if;
  select private.email_university(email) into campus from auth.users where id=member and email_confirmed_at is not null;
  if campus is null then raise exception 'University email required'; end if;
  insert into public.profiles(id,username,full_name,university_id,field_of_study)
    values(member,handle,btrim(name),campus,btrim(field))
    on conflict(id) do update set username=excluded.username,full_name=excluded.full_name,
      university_id=excluded.university_id,field_of_study=excluded.field_of_study;
  delete from public.profile_interests where profile_id=member;
  insert into public.profile_interests(profile_id,interest_id)
    select distinct member, interest from unnest(selected_interests) as interest;
  update public.account_access set onboarded_at=now() where user_id=member;
end $$;

create function public.review_student(member uuid, approved boolean, reason text) returns void
language sql security invoker set search_path = '' as $$ select private.review_student(member,approved,reason) $$;
create function public.complete_student_onboarding(name text, handle text, field text, selected_interests uuid[]) returns void
language sql security invoker set search_path = '' as $$ select private.complete_student_onboarding(name,handle,field,selected_interests) $$;
revoke all on function private.queue_student_approval(uuid,text), private.on_student_email_confirmed(),
  private.review_student(uuid,boolean,text), public.review_student(uuid,boolean,text),
  private.complete_student_onboarding(text,text,text,uuid[]), public.complete_student_onboarding(text,text,text,uuid[])
  from public, anon, authenticated;
grant execute on function private.review_student(uuid,boolean,text), public.review_student(uuid,boolean,text),
  private.complete_student_onboarding(text,text,text,uuid[]), public.complete_student_onboarding(text,text,text,uuid[])
  to authenticated;

insert into public.interests(name) values
  ('Cybersecurity'),('Artificial intelligence'),('Web development'),('Data science'),
  ('Robotics'),('Product design'),('Cloud and DevOps'),('Entrepreneurship')
on conflict(name) do nothing;

create or replace function private.review_event(event_id uuid, approved boolean, reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  submitter uuid;
begin
  if not private.is_admin() or approved is null or reason is null or char_length(btrim(reason)) not between 3 and 1000 then
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
