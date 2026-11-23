import { bindings, defineConfig, defineWorker } from "cf/config";

/**
 * vinext server actions execute INSIDE workerd. Values set on the build
 * machine (including NEXT_PUBLIC_* variables) are not automatically copied
 * into the Worker runtime. Explicit Cloudflare text bindings are required.
 *
 * These values are publicly shareable: the URL, publishable key and website
 * origin. Never put a Supabase secret/service-role key in a text binding.
 *
 * A preview must explicitly supply a separate Supabase project; never allow
 * an unconfigured preview Worker to silently use live student accounts.
 */
const productionDefaults = {
  siteUrl: "https://hackmate.yazerabdo01.workers.dev",
  supabaseUrl: "https://fqydthbluwwczwaytifz.supabase.co",
  publishableKey: "sb_publishable_53uEU-SMwek644dG-1UiXg_YB3Sq94r",
};

function publicBinding(name: string, productionValue: string): string {
  const configured = process.env[name]?.trim();
  if (configured) return configured;

  if (["preview", "staging", "development"].includes(process.env.CLOUDFLARE_ENV ?? "")) {
    throw new Error(`Missing ${name}: configure an isolated Supabase project for ${process.env.CLOUDFLARE_ENV}.`);
  }

  return productionValue;
}

const siteUrl = publicBinding("NEXT_PUBLIC_SITE_URL", productionDefaults.siteUrl);
const supabaseUrl = publicBinding("NEXT_PUBLIC_SUPABASE_URL", productionDefaults.supabaseUrl);
const publishableKey = publicBinding(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  productionDefaults.publishableKey,
);

export default defineConfig({
  worker: defineWorker({
    name: "hackmate",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-22",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Runtime bindings, accessible in workerd through process.env.
      APP_PUBLIC_SITE_URL: bindings.text(siteUrl),
      SUPABASE_URL: bindings.text(supabaseUrl),
      SUPABASE_PUBLISHABLE_KEY: bindings.text(publishableKey),
      // Retain standard names for existing Next server code and diagnostics.
      NEXT_PUBLIC_SITE_URL: bindings.text(siteUrl),
      NEXT_PUBLIC_SUPABASE_URL: bindings.text(supabaseUrl),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: bindings.text(publishableKey),
    },
  }),
});
