# HackMate implementation audit — 24 November 2026

This document records the first implementation pass against the connected GitHub repository and hosted Supabase project. It is an audit and execution checklist; it does not authorize production schema changes or deployment.

## Confirmed platform

- Application: Next.js App Router, TypeScript, Tailwind CSS.
- Hosting target documented by the project: Vercel.
- Backend: existing Supabase project `fqydthbluwwczwaytifz` (PostgreSQL 17, eu-central-2).
- Repository: `boukhariabdallahyasser-prog/hackmate`, default branch `main`.
- Current public routes include events, event details, authentication, account, teams, and staff dashboard.
- Existing product functionality includes email confirmation, password recovery, manual student review, event submissions/moderation, bookmarks, teams, applications, team invitations, notifications, reports, staff actions, and audit logs.

## Product decisions to implement

- Support multiple universities from the data model; ENSIA is the initial pilot.
- Keep opportunity detail pages public and discoverable without an account.
- Allow community contributions to the opportunity directory.
- Keep university verification manual; email confirmation and student verification are separate states.
- Restrict team formation and member discovery to verified ENSIA students for the initial pilot, while keeping the schema multi-university-ready.
- Use curated catalogs for universities, academic levels, fields, interests, skills, event categories, formats, and participation modes.
- Provide an administration workspace for verification, moderation, invitations, catalog management, account controls, and audit history.

## Gaps and mismatches found

1. Registration currently rejects email domains not present in `university_email_domains`. Confirm the intended registration policy before changing this guard; multi-university onboarding still needs a controlled institution registry.
2. The event insert policy currently requires a verified student and forces `moderation_status = 'pending'` and `source_status = 'community'`. The product needs an explicit distinction between who may submit, who may approve, and what "open publishing" means. Do not weaken moderation or allow arbitrary direct publication without an explicit policy.
3. Existing invitation tables cover team invitations only. They do not implement platform/student onboarding invitations, invitation quotas, expiring one-time codes, or referral attribution.
4. Team discovery and membership currently require verified status. The first pilot should enforce ENSIA membership at the database boundary, not only in UI filters.
5. The current hosted Supabase project records only migrations `20261122214251` and `20261122214527`. GitHub contains six migrations. Do not apply the remaining migrations to production until they have been replayed and tested in an isolated preview database.
6. Supabase Auth leaked-password protection is disabled. Enable it after reviewing the project's Auth configuration.
7. Supabase performance advisor reports 13 foreign keys without covering indexes. Add indexes only after checking existing indexes and query plans; do not drop indexes solely because they are currently unused on a low-traffic project.
8. Supabase performance advisor reports four pairs of permissive SELECT policies on events, teams, universities, and university email domains. Review policy composition and consolidate where behavior remains identical.

## Safe execution sequence

### Stage A — isolated development

- Keep all application changes on `feat/open-submissions-student-invitations`.
- Create a Supabase preview branch/project only after the owner approves its quoted hourly cost.
- Replay all six repository migrations in order in preview and compare the resulting schema with production.
- Run SQL/RLS, Auth, Storage, and multi-session team-capacity tests in preview.

### Stage B — product implementation

- Define platform invitations separately from team invitations.
- Use cryptographically random, single-use, expiring invitation tokens; store only token hashes.
- Add issuer, recipient email, university scope, role scope, status, expiry, accepted user, and audit events.
- Apply rate limits and prevent invitation acceptance from bypassing email confirmation or manual university verification.
- Implement the agreed community submission policy without exposing unreviewed opportunities publicly.
- Add ENSIA pilot restrictions at database/RPC level for team creation, applications, invitations, and member discovery.
- Add admin controls and audit events for invitation creation, revocation, acceptance, verification, and moderation.

### Stage C — release readiness

- Resolve Auth password-protection and RLS/performance findings.
- Test production callbacks and real SMTP using non-production test accounts first.
- Verify private evidence storage, retention, and access rules.
- Deploy only after preview checks pass and the owner explicitly approves production deployment.

## Current blockers

- A Supabase development branch is not yet created. The quoted cost is **$0.01344 per hour** while it exists; obtain explicit approval before creating it.
- Vercel is documented as the hosting target, but its direct ChatGPT connection is not yet confirmed. Connect the Vercel integration before requesting deployment actions through it.
- The exact interpretation of "open publishing" must be confirmed: open submissions with moderation, or immediate public publishing by contributors. The safe default is open submissions with moderation.
