import { afterEach, describe, expect, test, vi } from "vitest";
import { siteOrigin } from "@/lib/site-url";

afterEach(() => vi.unstubAllEnvs());

function clearOrigins() {
  for (const name of [
    "APP_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "VERCEL_ENV",
    "VERCEL_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ]) vi.stubEnv(name, "");
}

describe("siteOrigin", () => {
  test("uses local development by default", () => {
    clearOrigins();
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  test("uses the Vercel production URL when no custom domain is configured", () => {
    clearOrigins();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "hackmate-abc.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hackmate.vercel.app");
    expect(siteOrigin()).toBe("https://hackmate.vercel.app");
  });

  test("uses an explicit verified production origin when configured", () => {
    clearOrigins();
    vi.stubEnv("APP_PUBLIC_SITE_URL", "https://hackmate.example.org/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hackmate.vercel.app");
    expect(siteOrigin()).toBe("https://hackmate.example.org");
  });

  test("previews retain their own hostname even with a production origin configured", () => {
    clearOrigins();
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "hackmate-git-feature-boukhari.vercel.app");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackmate.vercel.app");
    expect(siteOrigin()).toBe("https://hackmate-git-feature-boukhari.vercel.app");
  });

  test("ignores malformed, credentialed and non-HTTPS remote origin settings", () => {
    clearOrigins();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://attacker@example.com");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "http://hackmate.vercel.app");
    vi.stubEnv("VERCEL_URL", "hackmate.vercel.app");
    expect(siteOrigin()).toBe("https://hackmate.vercel.app");
  });

  test("rejects URL paths and query strings in site origin settings", () => {
    clearOrigins();
    vi.stubEnv("APP_PUBLIC_SITE_URL", "https://example.com/auth/confirm?x=1");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    expect(siteOrigin()).toBe("http://localhost:3000");
  });
  test("Vercel production ignores a stale Cloudflare confirmation origin", () => {
    clearOrigins();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackmate.yazerabdo01.workers.dev");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hackmate-v8jj.vercel.app");
    expect(siteOrigin()).toBe("https://hackmate-v8jj.vercel.app");
  });

  test("Vercel deployment preserves a deliberately configured custom domain", () => {
    clearOrigins();
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://events.example.org");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "hackmate-v8jj.vercel.app");
    expect(siteOrigin()).toBe("https://events.example.org");
  });

});
