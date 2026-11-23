# Deploying HackMate

The main target is **Cloudflare Workers** with **Supabase Auth, Postgres and private Storage**. GitHub Actions builds pull requests and builds/deploys changes merged to `main`, provided the required settings exist. Vercel is not required for this deployment.

> Never merge an unreviewed change as a way to test production. The repo's [AGENTS.md](../AGENTS.md) requires owner approval before production deployment, changes to hosted data, or changes that incur charges.

## Verified state (23 November 2026)

- The repository contains **four** ordered SQL migrations in `supabase/migrations/`.
- The connected hosted Supabase project `fqydthbluwwczwaytifz` records **only the first two** migrations: `20261122214251` and `20261122214527`. The later product and student-approval features cannot be assumed to work in that database yet.
- GitHub Actions run `45085847935` passed lint, type checking, tests and the Worker build, **but did not deploy**. Cloudflare and Supabase Actions settings were blank. Earlier workflow behavior returned success even when deployment was skipped; the workflow now reports this as a failure on `main`.
- The last known Cloudflare production origin is `https://hackmate.yazerabdo01.workers.dev`. A successful build is not proof that this origin serves the latest commit.

Recheck the database migration list and deployment logs before using this status as a release decision.

## 1. Create an isolated preview first

1. Create or select a **separate** Supabase preview project. Do not replay migrations over existing tables in the hosted project.
2. Apply the four SQL migrations **in filename order** in the preview, then run the seeded local tests and real Supabase Auth/RLS/Storage integration tests. The current Vitest database tests emulate some Supabase platform tables; they do not replace a live integration test.
3. Configure email confirmations and actual SMTP delivery. In Supabase Auth, set the Site URL to the matching preview origin and permit `/auth/confirm`, including the recovery flow. Use the [confirmation](../supabase/templates/confirmation.html) and [recovery](../supabase/templates/recovery.html) templates.
4. After confirming the institution's real email domain, configure its registration record. The [ENSIA bootstrap SQL](../supabase/bootstrap/ensia.sql) assumes `ensia.edu.dz`; have the institution confirm that domain before using it.
5. Confirm the designated first administrator's email before following the privileged [bootstrap procedure](DEVELOPMENT.md). Never give staff privileges based on an unconfirmed address.
6. Test account confirmation, student approval, onboarding, evidence upload and viewing, event moderation, team capacity with independent connections, and password recovery. Verify RLS as anonymous, unverified, verified, staff and suspended accounts. Define evidence retention, deletion, backup and restore procedures before accepting real documents.

Hosted production migrations and data changes need explicit owner approval and a verified backup or rollback plan.

## 2. Configure GitHub Actions for Cloudflare

On the repository's GitHub page, open **Settings → Secrets and variables → Actions**. This works in a mobile browser as well.

| GitHub setting | Type | Source |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Repository variable | Supabase project API URL for the approved deployment |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Repository variable | Supabase publishable key for the **same** project |
| `CLOUDFLARE_ACCOUNT_ID` | Repository variable | Cloudflare account dashboard |
| `CLOUDFLARE_API_TOKEN` | Repository **secret** | Cloudflare token with least-privilege Workers deployment permissions |

The workflow sets `NEXT_PUBLIC_SITE_URL` to the production Workers origin. Do not store a service-role key, secret key, database password, or personal access token in any `NEXT_PUBLIC_*` variable or repository file. For separate preview deployments, use different Supabase credentials and origins, not production configuration.

Workflow behavior:
- Pull requests to `main`: `npm ci`, lint, type checks, database/unit tests and a Cloudflare Worker build. **No deployment**.
- Approved commits pushed to `main`: the same checks, then `cf deploy --prebuilt --mode production`.
- A missing setting causes the production deployment step to **fail clearly** with the missing setting names in the Actions summary, instead of showing a misleading green deployment.

Check the actual **Deploy to Cloudflare** step and verify the public origin after a successful deploy. Do not assume that a green *build* alone means the live Worker changed.

## 3. Migrate an approved production database

Once the preview tests pass, compare `supabase_migrations.schema_migrations` with the repository's migration files. Never re-run the first two migrations against the existing hosted project or edit their contents. Apply only the pending migration files in order through an approved process, verify schema, policies and grants, and rerun the integration checks before activating registration. Use a separate change window and backup.

The Supabase CLI v3 defaults to a **local** project and requires explicit `--remote` and interactive approval or `--yes` for hosted changes. Confirm the actual CLI version and its `--help` before running commands. This repository now uses `[local_smtp]` in `supabase/config.toml` in place of the retired `[inbucket]` section.

## 4. Post-deployment acceptance

Test the live event directory, calendar download, sign-in, student approval, onboarding, team join and leadership workflows, staff-only moderation and private evidence retrieval. Check that the Cloudflare Workers origin returns the intended build, that Auth redirects match the canonical origin, and that sensitive responses are not cached publicly.

For local development, run `npm ci`, `npx supabase start`, `npm run test:e2e`, and `npm run build:vinext` with appropriate local environment variables. See [Development](DEVELOPMENT.md) and [Security](SECURITY.md).
