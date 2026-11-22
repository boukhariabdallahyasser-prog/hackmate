# Development

Use Node.js 22 or newer, npm, and the committed lockfile.

```sh
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

`npm test` runs Vitest, React Testing Library, and embedded PostgreSQL (PGlite) tests. The database suite replays every migration with minimal stand-ins for Supabase Auth and Storage tables. It exercises real PostgreSQL privileges, RLS, transaction checks, and moderation. Playwright runs against a local fixture API and covers public browser routes and unauthenticated guards. These tests complement a full Supabase preview run with real email, API, and Storage services.

Run `npx supabase start` from the repository root with Docker running. The local database seeds a synthetic university and taxonomy. Use `npx supabase status` for the local API URL and publishable key. If browser downloads are restricted, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a compatible Chromium binary.

## Bootstrap staff in a fresh environment

For local development, register a student at the seeded university and confirm their email from the local inbox. For a hosted environment, seed an approved institution and actual institution domain supplied by the owner. Confirm the desired administrator's identity before running the following as a privileged database operator. Substitute the confirmed email address.

```sql
update public.account_access as access
set role = 'super_admin', status = 'verified'
from auth.users as account
where access.user_id = account.id
  and account.email = 'owner@campus.test'
  and account.email_confirmed_at is not null;
```

All subsequent staff role changes are audited and must run through an authorized super-admin account. Leave the local fixture domain out of hosted databases.
