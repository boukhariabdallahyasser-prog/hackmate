# Deployment

Target Vercel. Link the authorized private GitHub repository once it is ready. Configure `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for each environment. Preview deployments should use isolated test data.

Before release, apply reviewed migrations, verify Supabase redirect allowlists and email delivery, validate storage and role policies, confirm SEO and error reporting, and exercise the end-to-end workflow on a preview. Document database backup and restore before production. Obtain explicit approval before the production deployment.
