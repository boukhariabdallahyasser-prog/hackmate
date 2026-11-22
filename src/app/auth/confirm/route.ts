import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const client = await serverClient();
  const token = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  let path = "/auth/link-expired";
  if (
    client &&
    token &&
    (type === "email" || type === "signup" || type === "recovery")
  ) {
    const { error } = await client.auth.verifyOtp({ token_hash: token, type });
    if (!error) path = type === "recovery" ? "/auth/reset" : "/account";
  } else if (client && code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error)
      path =
        request.nextUrl.searchParams.get("flow") === "recovery"
          ? "/auth/reset"
          : "/account";
  }
  return NextResponse.redirect(
    new URL(path, process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin),
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
