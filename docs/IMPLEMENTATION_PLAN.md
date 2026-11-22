# Implementation plan

| Phase | Work                                                                                                                       | Exit criteria                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 0     | Inspect workspace, GitHub, and existing Supabase project. Document product and architecture.                               | The roadmap and existing-schema inventory are recorded and the repository is initialized.                         |
| 1     | Establish Next.js, TypeScript, Tailwind, UI primitives, configuration, public routes, and local checks.                    | Production build, lint, type checks, and responsive public smoke tests pass.                                      |
| 2     | Extend the recovered schema with taxonomies, invitations, moderation, notifications, grants, and private storage policies. | Fresh migration replay succeeds and role, storage, and concurrent membership tests pass in isolation.             |
| 3     | Build open sign-up, confirmation, recovery, session handling, evidence submission, and audited review.                     | Unapproved domains and unverified access are rejected. A school email and a manual review are both required.      |
| 4     | Build member profile editing, taxonomy selectors, and visibility controls.                                                 | Verified members can browse shared profile fields. Owners can choose which optional fields to share.              |
| 5     | Complete event search, dates, location, university, format and skill filters, moderation, bookmarks, and related events.   | Published pages are shareable and searchable. Submissions remain hidden until approved and bookmarks stay unique. |
| 6     | Build team creation, applications, invitations, member management, leadership transfer, and recruitment controls.          | Transactional tests confirm capacity, one leader, unique members, and expected authorization under concurrency.   |
| 7     | Build transparent teammate matching and team invitations.                                                                  | Recommendations explain skill, availability, role, and interest matches.                                          |
| 8     | Add notifications, reporting, and moderation audit.                                                                        | Actions produce one notification and report resolution records the reviewer and reason.                           |
| 9     | Build staff metrics and management screens.                                                                                | Moderator, admin, and super admin actions respect server and database permissions.                                |
| 10    | Add unit, integration, database, and browser regression coverage.                                                          | Required tests pass, including accessibility, responsive flows, and permission checks.                            |
| 11    | Configure Vercel preview, callbacks, monitoring, and recovery.                                                             | The owner can review and approve the tested preview before production.                                            |

The first public discovery milestone includes browsing, title search, category and format filters, start-date ordering, pagination, and shareable detail pages for approved events. The remaining dependencies for identity are a vetted domain registry, an isolated place to test approval workflows, and the database protections listed in Phase 2. See [TASKS.md](../TASKS.md) for the latest check results and GitHub publishing status.

## Product branch

The product branch implements the signed-in workflows on top of the public directory. Embedded PostgreSQL tests replay the migrations, and fixture-based browser checks run on desktop and mobile. The remaining release gates are a hosted preview with real authentication and document uploads, two-connection database testing, vetted domains, and owner approval for production.
