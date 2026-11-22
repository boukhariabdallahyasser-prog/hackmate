# Development

Use npm with the committed lockfile and Node.js 22 or later. The inspected Linux environment had Node.js 24, npm 11, Git, Codex, and Chromium. The workspace initially contained the brief and lacked a Git checkout. Docker, PostgreSQL CLI, and Supabase CLI were absent from PATH.

```sh
npm ci
npm run lint
npm run typecheck
npm run format:check
npx playwright install chromium
npm run test:e2e
npm run build
```

When Playwright's browser download is restricted, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed compatible Chromium binary. The public browser tests cover navigation, filter form submissions, mobile overflow, and invalid event slugs. Account and database transaction tests require a dedicated staging or local database with test fixtures.
