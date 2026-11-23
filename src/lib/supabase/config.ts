import { siteOrigin } from "@/lib/site-url";

/**
 * These are publishable Supabase settings, not server credentials. They can be
 * included in the client bundle because Postgres RLS remains the access boundary.
 *
 * The fallback is limited to HackMate's production hostnames. Preview and
 * staging deployments must supply their own public Supabase settings.
 */
const productionOrigins = new Set([
  "https://hackmate.yazerabdo01.workers.dev",
  "https://hackmate-v8jj.vercel.app",
]);

const productionSupabase = {
  url: "https://fqydthbluwwczwaytifz.supabase.co",
  key: "sb_publishable_53uEU-SMwek644dG-1UiXg_YB3Sq94r",
};

/**
 * Vercel reports the project hostname independently of NEXT_PUBLIC_SITE_URL.
 * Using this automatic value avoids disabling registration when a missing or
 * stale site-URL setting makes siteOrigin() resolve to another hostname.
 */
function isKnownProductionHostname(hostname: string | undefined): boolean {
  if (!hostname) return false;
  try {
    const url = new URL(
      /^https?:\/\//i.test(hostname) ? hostname : `https://${hostname}`,
    );
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash &&
      productionOrigins.has(url.origin)
    );
  } catch {
    return false;
  }
}

export function supabaseConfig() {
  const isPreviewOrStaging =
    process.env.VERCEL_ENV === "preview" ||
    ["preview", "staging", "development"].includes(
      process.env.CLOUDFLARE_ENV ?? "",
    );

  const isKnownProductionSite =
    !isPreviewOrStaging &&
    (productionOrigins.has(siteOrigin()) ||
      (process.env.VERCEL_ENV === "production" &&
        (isKnownProductionHostname(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
          isKnownProductionHostname(process.env.VERCEL_URL))));

  // Server runtime bindings and explicit environment settings take precedence.
  // Neither the fallback nor any public binding contains privileged credentials.
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (isKnownProductionSite ? productionSupabase.url : "");
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    (isKnownProductionSite ? productionSupabase.key : "");

  return url && key ? { url, key } : null;
}
