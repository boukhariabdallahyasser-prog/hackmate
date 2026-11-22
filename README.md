# HackMate

HackMate is a platform for Algerian university students to discover technology events and form teams. The current app provides a public event directory with title search, category and format filters, start-date sorting, and shareable event details.

## Run locally

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set the Supabase project URL and publishable key in `.env.local` to load events. The landing page works without a database connection. See [Development](docs/DEVELOPMENT.md) for checks and [Implementation plan](docs/IMPLEMENTATION_PLAN.md) for scope and acceptance criteria.

See [TASKS.md](TASKS.md) for the latest verification results and open work.
