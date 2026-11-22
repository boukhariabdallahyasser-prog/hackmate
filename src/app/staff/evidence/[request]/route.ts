import { NextResponse } from "next/server";
import { requireMember } from "@/lib/supabase/server";
import { uuid } from "@/lib/forms";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ request: string }> },
) {
  const { client } = await requireMember("admin");
  const { request } = await params;
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
  };
  if (!uuid.safeParse(request).success)
    return new NextResponse("Evidence unavailable", { status: 404, headers });
  const { data: verification } = await client
    .from("verification_requests")
    .select("evidence_path")
    .eq("id", request)
    .maybeSingle();
  if (!verification)
    return new NextResponse("Evidence unavailable", { status: 404, headers });
  const { data } = await client.storage
    .from("verification-evidence")
    .createSignedUrl(verification.evidence_path, 60, { download: true });
  if (!data)
    return new NextResponse("Evidence unavailable", { status: 404, headers });
  return NextResponse.redirect(data.signedUrl, { headers });
}
