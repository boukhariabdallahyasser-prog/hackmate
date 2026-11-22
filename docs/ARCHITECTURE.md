# Architecture

Next.js App Router hosts public pages and will host protected student and admin workflows in the same application. Supabase supplies PostgreSQL, Auth, and private Storage. Public reads use explicit projections and a sessionless publishable-key client. Protected workflows will use a session-bound server client and database policies.

Keep data access with its feature. Route components compose views and handle loading, errors, and empty states. Database transactions own cross-row invariants such as accepting applications and transferring leadership.

The current routes are `/`, `/about`, `/events`, and `/events/[slug]`. Event detail metadata includes a canonical URL and Open Graph metadata. Published events are read directly from Supabase at request time.
