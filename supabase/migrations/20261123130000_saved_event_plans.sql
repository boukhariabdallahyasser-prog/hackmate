-- Saved-event planning belongs to the signed-in student, not event organizers.
-- Only the bookmark owner can read/edit these fields. No notifications are sent.
alter table public.event_bookmarks
  add column personal_note text not null default ''
    check (char_length(personal_note) <= 600),
  add column attendance_plan text not null default 'interested'
    check (attendance_plan in ('interested', 'planning', 'registered'));

grant update (personal_note, attendance_plan)
  on public.event_bookmarks to authenticated;

create policy bookmark_owner_edit on public.event_bookmarks
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.is_verified())
  )
  with check (
    user_id = (select auth.uid())
    and (select private.is_verified())
  );

create index event_bookmarks_recent_by_owner
  on public.event_bookmarks (user_id, created_at desc);

-- Discovery filters and frequently used foreign keys.
create index events_approved_university_date
  on public.events (university_id, starts_at, id)
  where moderation_status = 'approved';

create index events_approved_format_date
  on public.events (format, starts_at, id)
  where moderation_status = 'approved';

create index admin_audit_logs_actor
  on public.admin_audit_logs (actor_id);

create index verification_requests_reviewer
  on public.verification_requests (reviewed_by);

create index verification_requests_university
  on public.verification_requests (university_id);
