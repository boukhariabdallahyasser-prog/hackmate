import { supabaseConfig } from "@/lib/supabase/config";
import { serverClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Public, read-only production diagnostic. It never returns API keys,
 * database rows, user data, credentials, or internal error messages.
 */
export async function GET() {
  const headers = {
    "Cache-Control": "no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  };

  if (!supabaseConfig()) {
    return Response.json(
      { status: "unavailable", service: "supabase", reason: "configuration_missing" },
      { status: 503, headers },
    );
  }

  try {
    const client = await serverClient();
    if (!client) {
      return Response.json(
        { status: "unavailable", service: "supabase", reason: "configuration_missing" },
        { status: 503, headers },
      );
    }
    const { error } = await client
      .from("university_email_domains")
      .select("id", { head: true, count: "exact" })
      .eq("active", true);

    if (error) {
      return Response.json(
        { status: "unavailable", service: "supabase", reason: "database_request_failed" },
        { status: 503, headers },
      );
    }
    return Response.json(
      { status: "ready", service: "supabase", registrationEligibility: "reachable" },
      { status: 200, headers },
    );
  } catch {
    return Response.json(
      { status: "unavailable", service: "supabase", reason: "network_or_runtime_error" },
      { status: 503, headers },
    );
  }
}
