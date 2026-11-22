# HackMate

HackMate helps Algerian university students discover tech events, meet collaborators, and form teams.

- Public event directory with shareable pages, title search, category and format filters, and date sorting.
- University email registration, confirmation, password recovery, private proof of enrollment, and manual student verification.
- Verified student profiles, explainable teammate recommendations, event interest, teams, invitations, and join requests.
- Event submissions and bookmarks, in-app notifications, reports, and a staff dashboard for moderation and administration.

## Run locally

Use Node.js 22 or newer. To run the full application, start a local Supabase stack with Docker and the Supabase CLI.

```sh
npm ci
npx supabase start
cp .env.example .env.local
npm run dev
```

Set the local Supabase API URL and publishable key in `.env.local`. The local seed enables registration with `@campus.test`; open the local mail inbox at `http://localhost:54324` to confirm the address. See [development](docs/DEVELOPMENT.md) for bootstrapping a local administrator, [deployment](docs/DEPLOYMENT.md) for the hosted setup, and [TASKS.md](TASKS.md) for verification status.
