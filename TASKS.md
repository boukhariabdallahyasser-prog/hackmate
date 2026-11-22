# Current milestone

- [x] Audit the GitHub repository and recover the existing foundation. The GitHub repository was empty at the start of this work.
- [x] Confirm the two existing migrations and 11 RLS-enabled public tables in the hosted HackMate project using read-only inspection.
- [x] Implement title search, format filtering, and start-date sorting for approved events. Keep selected filters in pagination links.
- [x] Run ESLint, TypeScript checks, the production build, and a production HTTP smoke test with fixture data. The smoke test covered combined filtering and sorting, literal punctuation, shareable metadata, and pending and invalid event URLs.
- [x] Pass all eight Playwright tests with desktop and mobile Chromium against the fixture API.
- [x] Restore GitHub write access and initialize the repository on `main`.
- [ ] Verify an isolated migration replay, evidence storage policies, domain validation, and RLS by role before implementing private onboarding and manual review.
- [ ] Complete profile editing, event submission and moderation, bookmarks, team and invitation flows, matching, notifications, and staff tools.
- [ ] Prepare a Vercel preview for owner review once GitHub publication and configuration are available.
