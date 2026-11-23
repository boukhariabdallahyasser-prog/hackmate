/**
 * This publishable API key is intentionally public. Never place a Supabase
 * secret/service-role key in source, NEXT_PUBLIC_* variables, or the browser.
 *
 * The production-only fallback prevents a missing Workers runtime env binding
 * from silently disabling the entire sign-in and registration flow. Other
 * deployments must supply their own Supabase values explicitly.
 */
const productionSite = "https://hackmate.yazerabdo01.workers.dev";
const productionSupabase = {
  url: "https://fqydthbluwwczwaytifz.supabase.co",
  key: "sb_publishable_53uEU-SMwek644dG-1UiXg_YB3Sq94r",
};

export function supabaseConfig() {
  const isKnownProductionSite =
    (process.env.APP_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL) === productionSite;

  // Cloudflare Worker runtime receives these server-only aliases as text
  // bindings. NEXT_PUBLIC_* may be inlined during a vinext/Next.js build but
  // cannot be relied on as Worker runtime environment variables.
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
