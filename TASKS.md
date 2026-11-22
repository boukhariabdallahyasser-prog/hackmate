# HackMate delivery status

- [x] Preserve the published Next.js foundation and the two existing Supabase migrations.
- [x] Add university-domain registration, email confirmation, sign-in, sign-out, recovery, and protected account routes.
- [x] Add student profile editing, private verification uploads, manual review, and review notifications.
- [x] Add event submissions, moderation, bookmarks, cover URLs, related events, reporting, and required skills.
- [x] Add team recruitment, applications, invitation management, transactional capacity checks, membership and leadership, and staff restrictions.
- [x] Add explainable teammate recommendations, event interest, student visibility settings, and university filters.
- [x] Add staff metrics, domain and taxonomy management, student controls, reports, and audit logs.
- [ ] Complete hosted Supabase preview verification with real email, Storage, and separate database connections. The existing hosted project has no preview branch.
- [ ] Configure the Vercel preview and vetted university domains. The connected Vercel account returned no HackMate project.
- [ ] Approve production deployment and evidence retention procedures.

## Verification recorded on this branch

- Formatting, ESLint, TypeScript, and the Next.js production build passed.
- Seven Vitest tests passed, including embedded PostgreSQL migration replay and access-policy checks.
- Ten Playwright tests passed on desktop and mobile against the fixture API.

## Student approval and dashboard

- Confirmed university emails create a review request and an in-app notification for administrators.
- Administrators review requests in the staff dashboard. Approved students choose a specialization and interests before the upcoming-events dashboard opens.
- Public event publication requires an administrator's approval. Verified members can suggest events.
- Hosted launch still requires the actual university email domain, a confirmed first admin, Supabase email configuration, and a Vercel deployment.

## Launch preparation

- The homepage shows upcoming approved events and links directly to the calendar and student registration.
- The ENSIA setup script can enable the official university domain in the target database with conflict checks.
- Production launch still needs the existing Vercel project-creation permission resolved and the designated admin to confirm their institutional email.

## Event tools and Workers build

- Added venue, inclusive date range, and open registration filters. Event details show when a registration deadline has passed.
- Added calendar downloads for published events, including a separate entry for the registration deadline.
- Added Cloudflare Workers configuration and build commands. Hosted Cloudflare deployment still needs account access, the deployment environment variables, and hosted Supabase verification.
