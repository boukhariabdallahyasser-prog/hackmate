import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseConfig } from "./config";
import type { Database } from "@/types/database";

export async function serverClient() {
  const config = supabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          for (const { name, value, options } of values) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components read cookies. Proxy persists refreshed sessions.
        }
      },
    },
  });
}

export const memberSession = cache(async () => {
  const client = await serverClient();
  if (!client) return null;
  const { data } = await client.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) return null;
  const { data: access } = await client
    .from("account_access")
    .select("role,status")
    .eq("user_id", id)
    .maybeSingle();
  return { client, id, access };
});

export async function requireMember(
  level: "signed-in" | "verified" | "moderator" | "admin" = "signed-in",
) {
  const session = await memberSession();
  if (!session) redirect("/auth/sign-in");
  const { access } = session;
  if (access?.status === "suspended") redirect("/auth/suspended");
  if (level !== "signed-in" && access?.status !== "verified")
    redirect("/account");
  if (
    level === "moderator" &&
    !["moderator", "admin", "super_admin"].includes(access?.role ?? "")
  )
    redirect("/account");
  if (
    level === "admin" &&
    !["admin", "super_admin"].includes(access?.role ?? "")
  )
    redirect("/account");
  return session;
}
