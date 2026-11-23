/**
 * One trusted public origin for signup/reset emails, callback redirects and
 * canonical metadata. Vercel supplies VERCEL_URL without the https:// prefix.
 * Preview callbacks must stay on their own deployment, not go to production.
 */
function normalizedOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  try {
    const url = new URL(
      /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
    );
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function siteOrigin(): string {
  // Vercel previews have separate hostnames and must never send email
  // confirmations to the production domain.
  if (process.env.VERCEL_ENV === "preview") {
    const preview = normalizedOrigin(process.env.VERCEL_URL);
    if (preview) return preview;
  }

  const configured =
    normalizedOrigin(process.env.APP_PUBLIC_SITE_URL) ||
    normalizedOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelProduction =
    normalizedOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  // A stale Cloudflare site setting must not send Vercel signup/reset
  // confirmation links back to the previous host. Preserve custom domains.
  if (
    process.env.VERCEL_ENV === "production" &&
    configured === "https://hackmate.yazerabdo01.workers.dev" &&
    vercelProduction === "https://hackmate-v8jj.vercel.app"
  ) {
    return vercelProduction;
  }

  return (
    configured ||
    vercelProduction ||
    normalizedOrigin(process.env.VERCEL_URL) ||
    "http://localhost:3000"
  );
}
