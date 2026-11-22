# Deployment

## Preview

1. Create or select an isolated Supabase preview environment. Replay the three migrations against that environment. The repository keeps the two migrations already recorded in the existing hosted HackMate project.
2. Enable email confirmations and configure email delivery. Use the [confirmation](../supabase/templates/confirmation.html) and [recovery](../supabase/templates/recovery.html) templates. Set Supabase Site URL to the canonical app URL and allow its `/auth/confirm` callback, including the recovery query variant if using the stock PKCE templates. Use a distinct Supabase project and matching Site URL for a preview that sends its own email.
3. Load vetted university domains and bootstrap the initial super admin through the privileged database console after the user confirms their university email. See [Development](DEVELOPMENT.md) for the SQL pattern.
4. Import the repository in Vercel and configure Preview environment variables `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep the production branch separate from the preview branch. Rebuild after setting the variables.
5. Exercise registration, email delivery and recovery, verification uploads and reviews, event moderation, and team enrollment on the preview. Run an independent-connection capacity test before enabling public recruitment.

Keep Supabase secret and service-role keys out of Vercel client environment variables and Git. For a hosted project that receives real evidence, define retention and access procedures, backups, and recovery before accepting submissions. Production migration and launch require owner approval.
