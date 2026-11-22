# Deployment

## Preview

1. Create or select an isolated Supabase preview environment. Replay the three migrations against that environment. The repository keeps the two migrations already recorded in the existing hosted HackMate project.
2. Enable email confirmations and configure email delivery. Use the [confirmation](../supabase/templates/confirmation.html) and [recovery](../supabase/templates/recovery.html) templates. Set Supabase Site URL to the canonical app URL and allow its `/auth/confirm` callback, including the recovery query variant if using the stock PKCE templates. Use a distinct Supabase project and matching Site URL for a preview that sends its own email.
3. Load vetted university domains and bootstrap the initial super admin through the privileged database console after the user confirms their university email. See [Development](DEVELOPMENT.md) for the SQL pattern.
4. Import the repository in Vercel and configure Preview environment variables `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep the production branch separate from the preview branch. Rebuild after setting the variables.
5. Exercise registration, email delivery and recovery, verification uploads and reviews, event moderation, and team enrollment on the preview. Run an independent-connection capacity test before enabling public recruitment.

Keep Supabase secret and service-role keys out of Vercel client environment variables and Git. For a hosted project that receives real evidence, define retention and access procedures, backups, and recovery before accepting submissions. Production migration and launch require owner approval.

Student approval requests are queued once the university email is confirmed. Administrators receive in-app notifications and can approve or decline requests at `/staff/students`. The initial super admin must be bootstrapped after email confirmation using the procedure in [Development](DEVELOPMENT.md). Use the exact official domain entered by the institution. Approval does not send a separate email.

## ENSIA launch

Use [ensia.sql](../supabase/bootstrap/ensia.sql) to enable `@ensia.edu.dz` registration in the intended environment after applying migrations. The script can be rerun and stops if the domain is disabled or assigned to another institution. Confirm that the designated first administrator can receive mail at the intended address. Only grant the initial super-admin role once that user has confirmed their university email. For email delivery to students outside the Supabase project team, use a configured SMTP provider.

## Cloudflare Workers

HackMate can also build as a Cloudflare Worker using vinext. The repo continues to support the regular Next.js build. Supabase still handles accounts, data, and private Storage.

- Use Node.js 22.12 or newer for the Vite build. Run `npm ci`, then `npm run build:vinext`. Run `npm run start:vinext` to serve the built Worker locally.
- Provide `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` during the build. Use the Cloudflare preview origin for `NEXT_PUBLIC_SITE_URL` when testing callbacks. Configure the matching Supabase site URL and redirect allowlist in the preview project before testing emails.
- To deploy from an authorized workstation, sign in with `npx cf auth login`, run `npm run deploy:vinext -- --dry-run`, and then run `npm run deploy:vinext` once the intended target is approved.
- Test sign-in, account approval, the event directory, calendar export, and private Storage on a preview before moving a production domain. The application queries live data, so this configuration does not provision an R2 cache or Durable Object.
