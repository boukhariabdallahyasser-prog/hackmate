-- Event artwork is public by design; verification evidence stays private.
-- The student may upload only to their own random-name namespace.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  true,
  3145728,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

create policy "event_covers_verified_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-covers'
  and (select private.is_verified())
  and split_part(name, '/', 1) = (select auth.uid())::text
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
);

-- Public event posters may be retrieved by guests. Never grant this on
-- the private 'verification-evidence' bucket.
grant select on storage.objects to anon;
create policy "event_covers_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-covers');

create policy "event_covers_owner_cleanup"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-covers'
  and split_part(name, '/', 1) = (select auth.uid())::text
  and (select private.is_verified())
);
