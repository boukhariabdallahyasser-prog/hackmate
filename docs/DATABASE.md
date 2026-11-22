# Database

The first two migrations match the existing HackMate Supabase project. The third extends the schema with private verification policies, normalized skill and interest associations, team invitations, event interest, reports, settings, and notifications.

`account_access` is the authorization record for role and verification status. Confirmed university emails map to an active university domain. Manual review binds a verified profile to that institution. Profiles and their taxonomies respect member-only visibility and the student's discoverability preference.

Row-level security and explicit grants cover the public schema. Events have a public approved-only view of their rows via RLS. Staff decisions use audited transactions. Invitation acceptance, application approval, and leadership changes lock the same team row before modifying members. The team leader consumes one roster slot and is represented by `teams.leader_id`.

Verification stays in the private `verification-evidence` bucket. Owner-based uploads use unique object paths. Staff access requires a referenced verification request and current database permissions. Download links expire after 60 seconds.

The embedded PostgreSQL tests verify a clean migration replay and role boundaries. Hosted Supabase Auth, email, Storage, and real concurrent connections should be verified in the preview environment.
