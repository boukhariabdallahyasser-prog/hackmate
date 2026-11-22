# HackMate

Build the English-language event discovery and team formation platform for Algerian university students. Follow the product decisions in [docs/PRD.md](docs/PRD.md) and the acceptance gates in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

- Use npm, TypeScript strict mode, Next.js App Router, Tailwind, and typed Supabase queries.
- Preserve applied migrations. Introduce schema changes with incremental migrations and test against an isolated database.
- Enforce permissions in PostgreSQL and at server entry points. Keep evidence private and secrets out of source control.
- Use feature branches and keep main buildable. Verify lint, type checks, browser tests, and the production build before merging.
- Obtain owner approval before production deployment, changes to production data, account permissions, or any action that incurs charges.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
