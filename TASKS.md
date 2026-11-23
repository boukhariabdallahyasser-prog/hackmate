# HackMate delivery status

- [x] Preserve the published Next.js foundation and the two existing Supabase migrations.
- [x] Add university-domain registration, email confirmation, sign-in, sign-out, recovery, and protected account routes.
- [x] Add student profile editing, private verification uploads, manual review, and review notifications.
- [x] Add event submissions, moderation, bookmarks, cover URLs, related events, reporting, and required skills.
- [x] Add team recruitment, applications, invitation management, transactional capacity checks, membership and leadership, and staff restrictions.
- [x] Add explainable teammate recommendations, event interest, student visibility settings, and university filters.
- [x] Add staff metrics, domain and taxonomy management, student controls, reports, and audit logs.
- [ ] Complete hosted Supabase preview verification with real email, Storage, and separate database connections. The existing hosted project has no preview branch.
- [ ] Configure a separate Supabase/Cloudflare preview and vetted university domains; do not use the live database for untested migrations.
- [ ] Validate and approve the two pending production migrations, evidence retention, and any live deployment.
- [ ] Set the Cloudflare/Supabase GitHub Actions variables and Cloudflare deployment secret; the previous main workflow built successfully but skipped deployment.

## Verification recorded on this branch

- Formatting, ESLint, TypeScript, and the Next.js production build passed.
- Seven Vitest tests passed, including embedded PostgreSQL migration replay and access-policy checks.
- Ten Playwright tests passed on desktop and mobile against the fixture API.

## Student approval and dashboard

- Confirmed university emails create a review request and an in-app notification for administrators.
- Administrators review requests in the staff dashboard. Approved students choose a specialization and interests before the upcoming-events dashboard opens.
- Public event publication requires an administrator's approval. Verified members can suggest events.
- Hosted launch still requires the verified university email domain, a confirmed first admin, Supabase email configuration, migration verification, and an approved Cloudflare deployment.

## Launch preparation

- The homepage shows upcoming approved events and links directly to the calendar and student registration.
- The ENSIA setup script can enable the official university domain in the target database with conflict checks.
- Production launch still requires approval for the hosted migrations and Workers deployment, configured GitHub Actions settings, and confirmation of the designated admin's institutional email.

## Event tools and Workers build

- Added venue, inclusive date range, and open registration filters. Event details show when a registration deadline has passed.
- Added calendar downloads for published events, including a separate entry for the registration deadline.
- Added Cloudflare Workers configuration and build commands. The last recorded GitHub Actions build was green but its Cloudflare deployment was skipped because all required deployment settings were blank.
- The connected hosted Supabase database records migration versions 20261122214251 and 20261122214527 only; versions 20261122225249 and 20261122232733 are still pending. Confirm the current state before any production change.
