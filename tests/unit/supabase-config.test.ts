import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { supabaseConfig } from "@/lib/supabase/config";

afterEach(() => vi.unstubAllEnvs());

function withoutRuntimeBindings() {
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
  vi.stubEnv("APP_PUBLIC_SITE_URL", "");
}

describe("Supabase runtime configuration", () => {
  test("production HackMate has safe public-only defaults", () => {
    withoutRuntimeBindings();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackmate.yazerabdo01.workers.dev");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toEqual({
      url: "https://fqydthbluwwczwaytifz.supabase.co",
      key: expect.stringMatching(/^sb_publishable_/),
    });
  });

  test("production build can initialize without Worker site binding", () => {
    withoutRuntimeBindings();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLOUDFLARE_ENV", "");
    expect(supabaseConfig()).toEqual({
      url: "https://fqydthbluwwczwaytifz.supabase.co",
      key: expect.stringMatching(/^sb_publishable_/),
    });
  });

  test("preview environment cannot use production fallback", () => {
    withoutRuntimeBindings();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CLOUDFLARE_ENV", "preview");
    expect(supabaseConfig()).toBeNull();
  });

  test("configured credentials always override production defaults", () => {
    withoutRuntimeBindings();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackmate.yazerabdo01.workers.dev");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://preview.example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    expect(supabaseConfig()).toEqual({
      url: "https://preview.example.supabase.co",
      key: "test-publishable-key",
    });
  });

  test("local and preview environments never silently use production Supabase", () => {
    withoutRuntimeBindings();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toBeNull();
  });

  test("Cloudflare Worker text bindings override build-time browser settings", () => {
    vi.stubEnv("APP_PUBLIC_SITE_URL", "https://hackmate.yazerabdo01.workers.dev");
    vi.stubEnv("SUPABASE_URL", "https://runtime-project.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "runtime-publishable-test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://build-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "build-publishable-test");

    expect(supabaseConfig()).toEqual({
      url: "https://runtime-project.supabase.co",
      key: "runtime-publishable-test",
    });
  });

  test("Worker config includes all required runtime bindings", () => {
    const config = readFileSync(resolve(process.cwd(), "cloudflare.config.ts"), "utf8");
    for (const name of [
      "APP_PUBLIC_SITE_URL",
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
    ]) {
      expect(config).toMatch(new RegExp(`\\b${name}: bindings\\.text\\(`));
    }
    expect(config).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
