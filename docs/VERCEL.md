# HackMate on Vercel

HackMate is a **Next.js App Router** application deployed from
[GitHub](https://github.com/boukhariabdallahyasser-prog/hackmate) with
Supabase as its existing Auth, Postgres and Storage backend.
Cloudflare Workers is the former hosting target. Migrating to Vercel
does **not** require moving or recreating the Supabase database.

## Import the existing GitHub repository

1. Sign in to [Vercel](https://vercel.com/new).
2. Choose **Import Git Repository**. In GitHub integration, choose the
   `boukhariabdallahyasser-prog` account and import `hackmate`.
3. Keep **Root Directory** as `./`, **Framework** as **Next.js**,
   **Build Command** as `npm run build` and the default install command
   `npm install`. The repository lockfile works with `npm ci` in CI.
4. Select the `main` branch as the production branch. This repository
   has no `vercel.json` override and uses Vercel's standard Next.js builder.
5. During import, configure the **Production** environment variables
   below. Do not supply secrets in source control or ChatGPT.
6. Click **Deploy**. After a successful deployment, take the production
   URL shown by Vercel from **Project → Domains**.

If Vercel reports `gitRepository missing required property type`,
do not paste JSON or edit the GitHub repository. Start a new import
using the GitHub repository picker, which supplies the Git provider
(`type: github`) itself. If your ChatGPT Vercel integration gets a
`403 Forbidden` when creating a project, use Vercel's own dashboard:
the connected app's team permission and the Git provider link are
independent permissions.

## Required Vercel project environment variables

Use **Project → Settings → Environment Variables**.

| Name | Value | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fqydthbluwwczwaytifz.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Current **publishable** key in Supabase → Project Settings → API Keys | Production |
| `NEXT_PUBLIC_SITE_URL` | Your exact Vercel production HTTPS origin from Project → Domains, no trailing slash | Production |

If you prefer not to set `NEXT_PUBLIC_SITE_URL`, Vercel's automatic
`VERCEL_PROJECT_PRODUCTION_URL` is supported by the application's
`siteOrigin()` resolver. Configure the exact URL for custom domains.
After changing variables, **redeploy** because `NEXT_PUBLIC_*`
variables are also used at Next.js build time.

Do not put `service_role` keys, `sb_secret_*` keys, database
passwords, or Cloudflare API tokens in `NEXT_PUBLIC_*` settings.

Vercel's automatic `VERCEL_URL` is used for preview callback origins
if `VERCEL_ENV=preview`, regardless of the production site URL.
Previews should use a **separate preview Supabase project**, with
separately scoped environment variables, before accepting test signups.
Without those variables, protected features will show a temporary
Supabase configuration error rather than connecting to production.

## Configure Supabase Auth redirect URLs

In the *existing* Supabase project
[Auth → URL Configuration](https://supabase.com/dashboard/project/fqydthbluwwczwaytifz/auth/url-configuration):

1. Set **Site URL** to the chosen Vercel production URL.
2. Add this exact URL under **Redirect URLs**:
   `https://<your-project>.vercel.app/auth/confirm`.
3. If you use a custom domain, also add its exact
   `https://<your-domain>/auth/confirm`.
4. Only if preview accounts are isolated or intentionally authorized,
   allow the preview URL pattern described in
   [Supabase's official guide](https://supabase.com/docs/guides/auth/redirect-urls):
   `https://*-boukhariabdallahyasser-prog.vercel.app/**`.
   An exact production callback is safer than unrestricted wildcards.
5. Keep any active Cloudflare callback in the allowed list during
   transition, if the old site remains in use.
6. Check email delivery settings, SMTP rate limits and the confirmation
   and recovery templates. URL configuration alone does not guarantee
   that confirmation emails are delivered.

Registration requires an approved university email domain and a
working SMTP sender. Accounts remain subject to verification and
administrator approval.

## Verify actual Vercel deployment

After Vercel reports **READY** (not merely a successful source build):

1. Open `https://<your-project>.vercel.app/api/health`.
   Expect HTTP 200 with
   `{"status":"ready","service":"supabase","registrationEligibility":"reachable"}`.
   If it returns HTTP 503 with `configuration_missing`,
   Vercel is missing a Supabase URL or publishable key.
2. Open `/auth/register` and check that registration is displayed.
   Use a genuine, eligible institutional email for an end-to-end signup
   test only with consent. Confirm that the email link returns to the
   Vercel domain, not to Cloudflare or localhost.
3. Verify sign-in, password recovery, student onboarding and staff
   approval with appropriately permissioned test accounts. Then verify
   event search, bookmarks, private storage and team operations.
4. Check Vercel build/runtime logs and Supabase Auth logs. A healthy
   API endpoint is a connectivity check, not proof of working email
   delivery or correct permissions.
5. Keep Cloudflare running until these checks succeed. Changing hosting
   does not change a Cloudflare `workers.dev` URL to a `vercel.app`
   URL. If replacing a custom domain later, handle its DNS separately.

## GitHub checks and future updates

The file `.github/workflows/cloudflare.yml` is retained for history
but is now a **CI-only Next.js workflow**. It runs lint, types, unit
tests, browser tests, and `next build`. It no longer tries to use
a `CLOUDFLARE_API_TOKEN`, which was blocking unrelated GitHub builds.
Once the Vercel Git integration is connected, Vercel automatically
builds PR previews and deploys updates merged into `main`.

The Cloudflare Worker config remains in the repository as a historical
fallback; it has **not** been redeployed, deleted or modified.
