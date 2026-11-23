import { afterEach, describe, expect, test, vi } from "vitest";
import { supabaseConfig } from "@/lib/supabase/config";

afterEach(() => vi.unstubAllEnvs());

describe("Supabase runtime configuration", () => {
  test("production HackMate has safe public-only defaults", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackmate.yazerabdo01.workers.dev");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toEqual({
      url: "https://fqydthbluwwczwaytifz.supabase.co",
      key: expect.stringMatching(/^sb_publishable_/),
    });
  });

  test("configured credentials always override production defaults", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hackmate.yazerabdo01.workers.dev");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://preview.example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    expect(supabaseConfig()).toEqual({
      url: "https://preview.example.supabase.co",
      key: "test-publishable-key",
    });
  });

  test("local and preview environments never silently use production Supabase", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toBeNull();
  });
});
