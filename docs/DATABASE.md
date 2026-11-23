# Database

The first two migrations match the existing HackMate Supabase project. The third extends the schema with private verification policies, normalized skill and interest associations, team invitations, event interest, reports, settings, and notifications.

`account_access` is the authorization record for role and verification status. Confirmed university emails map to an active university domain. Manual review binds a verified profile to that institution. Profiles and their taxonomies respect member-only visibility and the student's discoverability preference.

Row-level security and explicit grants cover the public schema. Events have a public approved-only view of their rows via RLS. Staff decisions use audited transactions. Invitation acceptance, application approval, and leadership changes lock the same team row before modifying members. The team leader consumes one roster slot and is represented by `teams.leader_id`.

Verification stays in the private `verification-evidence` bucket. Owner-based uploads use unique object paths. Staff access requires a referenced verification request and current database permissions. Download links expire after 60 seconds.

The embedded PostgreSQL tests verify a clean migration replay and role boundaries. Hosted Supabase Auth, email, Storage, and real concurrent connections should be verified in the preview environment.


## Saved-event planning and campus discovery

Migration `20261123130000_saved_event_plans.sql` extends existing `event_bookmarks` with
`personal_note` (up to 600 characters) and `attendance_plan`
(`interested`, `planning`, or `registered`). These fields are not
notifications, calendar bookings, or organizer-verified registrations.
They are an individual's own planning notes.

The migration grants `authenticated` only column-level UPDATE access for
those two fields. RLS requires the **verified bookmark owner** in both
`USING` and `WITH CHECK`. Bookmark SELECT remains private to the owner.
Do not broaden these grants to `anon` or expose another student's plans via
a public view or recommendation query.

The events directory now filters by `university_id` using only active
university options, with a strict UUID parser. The migration adds partial
indexes on approved events by university and format, plus indexes for
previously unindexed audit and verification foreign keys.

The connected hosted database currently records only the first **two**
migration files. The product migration, student approval migration, and
saved-event migration must be validated in an isolated Supabase preview and
applied **in order** before enabling the new saved-event workflow in production.
A `PGlite` migration replay and role policy test is included, but does
not substitute for hosted Auth, PostgREST, or Storage integration testing.
