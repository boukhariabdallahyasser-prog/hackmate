import { siteOrigin } from "@/lib/site-url";

/**
 * Supabase's publishable key is public, including in a browser bundle.
 * Never put a secret key or service-role key in this file or NEXT_PUBLIC_*.
 *
 * Known production origins get a last-resort fallback when a host has not
 * injected public variables into its server runtime. Preview/other sites
 * still require explicit credentials, preventing accidental use of
 * production student records.
 */
const productionOrigins = new Set([
  "https://hackmate.yazerabdo01.workers.dev",
  "https://hackmate-v8jj.vercel.app",
]);
const productionSupabase = {
  url: "https://fqydthbluwwczwaytifz.supabase.co",
  key: "sb_publishable_53uEU-SMwek644dG-1UiXg_YB3Sq94r",
};

export function supabaseConfig() {
  const isKnownProductionSite =
    process.env.VERCEL_ENV !== "preview" &&
    productionOrigins.has(siteOrigin());

  // Workers use the SUPABASE_* server bindings; Next.js on Vercel can use
  // NEXT_PUBLIC_* directly. Explicit credentials always take precedence.
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
