# Database

The existing HackMate Supabase project reported two migrations, `20261122214251_identity_security_foundation` and `20261122214527_event_team_foundation`. The applied SQL was recovered from migration history and the TypeScript types were generated from the hosted schema. The hosted project was inspected with read-only queries.

The 11 public tables have RLS enabled. The schema covers university domains, account access, profiles, verification requests, audit logs, events, bookmarks, teams, members, and applications. There is an application-review RPC. Its concurrency behavior still needs isolated integration tests.

The project reported zero approved email domains and zero published events. The evidence bucket is private and has size and MIME restrictions. The inspection found no storage policy specific to that bucket. Add and verify signed-in upload and staff review permissions before opening verification.

Missing schema areas include taxonomies and associations, invitations, notifications, reports, moderation actions, and platform settings. Critical updates require incremental migrations and refreshed generated types.
